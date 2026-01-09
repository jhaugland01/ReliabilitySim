import express from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { SimulationEngine } from '../simulator.js';

const router = express.Router();
const activeRuns = new Map();

// Get all runs for a scenario
router.get('/scenario/:scenarioId', (req, res) => {
  const runs = db.prepare('SELECT * FROM runs WHERE scenario_id = ? ORDER BY started_at DESC').all(req.params.scenarioId);
  res.json(runs.map(r => ({
    ...r,
    summary: r.summary ? JSON.parse(r.summary) : null,
    events: r.events ? JSON.parse(r.events) : [],
    metrics: r.metrics ? JSON.parse(r.metrics) : []
  })));
});

// Get single run
router.get('/:id', (req, res) => {
  const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }
  res.json({
    ...run,
    summary: run.summary ? JSON.parse(run.summary) : null,
    events: run.events ? JSON.parse(run.events) : [],
    metrics: run.metrics ? JSON.parse(run.metrics) : []
  });
});

// Start a new run
router.post('/start', (req, res) => {
  const { scenarioId, seed } = req.body;
  
  const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(scenarioId);
  if (!scenario) {
    return res.status(404).json({ error: 'Scenario not found' });
  }

  const config = JSON.parse(scenario.config);
  const runId = nanoid(10);
  const actualSeed = seed || Date.now();

  db.prepare(`
    INSERT INTO runs (id, scenario_id, seed, status, duration, tick_interval, started_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    runId,
    scenarioId,
    actualSeed,
    'running',
    config.duration,
    config.tickInterval,
    Date.now()
  );

  res.json({ runId });
});

// Stream run results (SSE)
router.get('/:id/stream', (req, res) => {
  const runId = req.params.id;
  
  const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(runId);
  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }

  if (run.status !== 'running') {
    return res.status(400).json({ error: 'Run is not active' });
  }

  const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(run.scenario_id);
  const config = JSON.parse(scenario.config);

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Run simulation
  const simulator = new SimulationEngine(config, run.seed);
  const totalTicks = Math.ceil((config.duration * 1000) / config.tickInterval);
  
  let currentTick = 0;
  const allEvents = [];

  const interval = setInterval(() => {
    if (currentTick >= totalTicks) {
      // Generate final summary
      const allMetrics = simulator.metrics;
      const allLatencies = allMetrics.flatMap(m => 
        Array(m.successCount + m.failureCount).fill(m.avgLatency)
      );

      const downtimeTicks = allMetrics.filter(m => m.systemState === 'down').length;
      const downtimeSec = (downtimeTicks * config.tickInterval) / 1000;
      const circuitTrips = simulator.events.filter(e => e.message.includes('Circuit opened')).length;

      let mainCause = 'System operated normally';
      const totalErrorRate = simulator.totalRequests > 0 
        ? (simulator.totalFailures / simulator.totalRequests) * 100 
        : 0;
      const hasRetries = config.retry.maxRetries > 0;
      const retryStorms = simulator.events.filter(e => e.message.includes('Retry storm')).length;

      if (retryStorms > 0 && hasRetries) {
        mainCause = 'Retry storm caused cascading failures and increased load';
      } else if (totalErrorRate > 40) {
        mainCause = 'High base failure rate overwhelmed system capacity';
      } else if (downtimeSec > config.duration * 0.3) {
        mainCause = 'Extended downtime due to capacity saturation';
      } else if (circuitTrips > 2) {
        mainCause = 'Multiple circuit breaker trips indicate unstable conditions';
      }

      const summary = {
        totalRequests: simulator.totalRequests,
        totalSuccesses: simulator.totalSuccesses,
        totalFailures: simulator.totalFailures,
        successRate: simulator.totalRequests > 0 ? (simulator.totalSuccesses / simulator.totalRequests) * 100 : 0,
        errorRate: totalErrorRate,
        avgLatency: allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length,
        p95Latency: simulator.calculatePercentile(allLatencies, 0.95),
        maxLatency: Math.max(...allLatencies),
        downtimeSec,
        circuitTrips,
        mainCause
      };
      
      db.prepare(`
        UPDATE runs 
        SET status = ?, summary = ?, events = ?, metrics = ?, completed_at = ?
        WHERE id = ?
      `).run(
        'completed',
        JSON.stringify(summary),
        JSON.stringify(simulator.events),
        JSON.stringify(allMetrics),
        Date.now(),
        runId
      );

      res.write(`data: ${JSON.stringify({ type: 'complete', summary })}\n\n`);
      res.end();
      clearInterval(interval);
      return;
    }

    // Process single tick
    const tickMetrics = simulator.processTick();
    simulator.metrics.push(tickMetrics);
    simulator.updateSystemState(tickMetrics);

    res.write(`data: ${JSON.stringify({ type: 'tick', data: tickMetrics, events: simulator.events })}\n\n`);
    currentTick++;
  }, config.tickInterval);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Compare two runs
router.post('/compare', (req, res) => {
  const { runIdA, runIdB } = req.body;

  const runA = db.prepare('SELECT * FROM runs WHERE id = ?').get(runIdA);
  const runB = db.prepare('SELECT * FROM runs WHERE id = ?').get(runIdB);

  if (!runA || !runB) {
    return res.status(404).json({ error: 'One or both runs not found' });
  }

  const scenarioA = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(runA.scenario_id);
  const scenarioB = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(runB.scenario_id);

  const summaryA = JSON.parse(runA.summary);
  const summaryB = JSON.parse(runB.summary);
  const configA = JSON.parse(scenarioA.config);
  const configB = JSON.parse(scenarioB.config);

  // Generate comparison analysis
  const differences = [];

  if (configA.retry.maxRetries !== configB.retry.maxRetries) {
    differences.push(`Retries changed from ${configA.retry.maxRetries} to ${configB.retry.maxRetries}`);
  }

  if (configA.circuitBreaker.enabled !== configB.circuitBreaker.enabled) {
    differences.push(`Circuit breaker ${configA.circuitBreaker.enabled ? 'disabled' : 'enabled'}`);
  }

  if (configA.rps !== configB.rps) {
    differences.push(`RPS changed from ${configA.rps} to ${configB.rps}`);
  }

  const errorRateDiff = summaryB.errorRate - summaryA.errorRate;
  const latencyDiff = summaryB.p95Latency - summaryA.p95Latency;
  const downtimeDiff = summaryB.downtimeSec - summaryA.downtimeSec;

  let analysis = '';
  if (Math.abs(errorRateDiff) > 5) {
    analysis += `Error rate ${errorRateDiff > 0 ? 'increased' : 'decreased'} by ${Math.abs(errorRateDiff).toFixed(1)}%. `;
  }
  if (Math.abs(latencyDiff) > configA.baseLatency * 0.5) {
    analysis += `P95 latency ${latencyDiff > 0 ? 'increased' : 'decreased'} by ${Math.abs(latencyDiff).toFixed(0)}ms. `;
  }
  if (Math.abs(downtimeDiff) > 1) {
    analysis += `Downtime ${downtimeDiff > 0 ? 'increased' : 'decreased'} by ${Math.abs(downtimeDiff).toFixed(1)}s. `;
  }

  res.json({
    runA: {
      ...runA,
      scenario: scenarioA,
      summary: summaryA,
      metrics: JSON.parse(runA.metrics)
    },
    runB: {
      ...runB,
      scenario: scenarioB,
      summary: summaryB,
      metrics: JSON.parse(runB.metrics)
    },
    differences,
    analysis: analysis || 'Results are similar with no major differences.'
  });
});

export default router;
