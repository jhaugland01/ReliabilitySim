// Seeded pseudo-random number generator (xorshift)
// This ensures deterministic behavior - same seed always produces same sequence
class Random {
  constructor(seed) {
    this.state = seed || 123456789;
  }

  next() {
    // xorshift algorithm - fast, good distribution, predictable
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x;
    return ((x >>> 0) / 0xffffffff);
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

const SYSTEM_STATES = {
  STABLE: 'stable',
  DEGRADED: 'degraded',
  DOWN: 'down'
};

const CIRCUIT_STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open'
};

export class SimulationEngine {
  constructor(config, seed) {
    this.config = config;
    this.random = new Random(seed);
    this.state = SYSTEM_STATES.STABLE;
    this.circuitState = CIRCUIT_STATES.CLOSED;
    this.metrics = [];
    this.events = [];
    this.currentTick = 0;
    
    // Circuit breaker tracking
    this.recentErrors = [];
    this.circuitOpenedAt = null;
    this.halfOpenTestCount = 0;
    
    // Request queue for capacity modeling
    this.requestQueue = 0;
    this.totalRequests = 0;
    this.totalSuccesses = 0;
    this.totalFailures = 0;
  }

  run() {
    const totalTicks = Math.ceil((this.config.duration * 1000) / this.config.tickInterval);
    
    for (let tick = 0; tick < totalTicks; tick++) {
      this.currentTick = tick;
      const tickMetrics = this.processTick();
      this.metrics.push(tickMetrics);
      
      // Update system state based on current conditions
      this.updateSystemState(tickMetrics);
    }

    return {
      metrics: this.metrics,
      events: this.events,
      summary: this.generateSummary()
    };
  }

  processTick() {
    const timeMs = this.currentTick * this.config.tickInterval;
    const requestsThisTick = this.calculateRequestsForTick();
    
    let successCount = 0;
    let failureCount = 0;
    let latencies = [];
    let retryCount = 0;

    for (let i = 0; i < requestsThisTick; i++) {
      const result = this.processRequest();
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      latencies.push(result.latency);
      retryCount += result.retries;
    }

    // Update queue (simplified capacity model)
    const processed = Math.min(requestsThisTick, this.config.capacity);
    this.requestQueue = Math.max(0, this.requestQueue + requestsThisTick - processed);

    // Calculate metrics
    const errorRate = requestsThisTick > 0 ? (failureCount / requestsThisTick) * 100 : 0;
    const avgLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0;
    const p95Latency = this.calculatePercentile(latencies, 0.95);

    this.totalRequests += requestsThisTick;
    this.totalSuccesses += successCount;
    this.totalFailures += failureCount;

    // Update circuit breaker state
    this.updateCircuitBreaker(errorRate);

    return {
      time: timeMs / 1000,
      requestsPerSec: requestsThisTick / (this.config.tickInterval / 1000),
      successCount,
      failureCount,
      errorRate,
      avgLatency,
      p95Latency,
      maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
      retryCount,
      queueDepth: this.requestQueue,
      circuitState: this.circuitState,
      systemState: this.state
    };
  }

  calculateRequestsForTick() {
    const baseRequests = Math.floor((this.config.rps * this.config.tickInterval) / 1000);
    // Add some variance
    const variance = Math.floor(this.random.next() * baseRequests * 0.2);
    return Math.max(1, baseRequests + variance - (baseRequests * 0.1));
  }

  processRequest() {
    let retries = 0;
    let success = false;
    let latency = 0;

    // Circuit breaker fast-fail
    if (this.circuitState === CIRCUIT_STATES.OPEN) {
      return { success: false, latency: 5, retries: 0 };
    }

    // Half-open test
    if (this.circuitState === CIRCUIT_STATES.HALF_OPEN) {
      this.halfOpenTestCount++;
      if (this.halfOpenTestCount > 5) {
        // Enough successful tests, close circuit
        this.circuitState = CIRCUIT_STATES.CLOSED;
        this.circuitOpenedAt = null;
        this.addEvent('Circuit closed after successful test traffic');
      }
    }

    while (retries <= this.config.retry.maxRetries) {
      latency += this.calculateLatency();
      
      if (!this.shouldFail()) {
        success = true;
        break;
      }
      
      if (retries < this.config.retry.maxRetries) {
        const backoffDelay = this.calculateBackoff(retries);
        latency += backoffDelay;
        retries++;
      } else {
        break;
      }
    }

    return { success, latency, retries };
  }

  shouldFail() {
    let failureProb = this.config.baseFailureProbability;

    // Increase failure probability when over capacity
    if (this.requestQueue > this.config.capacity * 0.5) {
      failureProb += 0.15;
    }
    
    if (this.requestQueue > this.config.capacity) {
      failureProb += 0.25;
    }

    // System state influences failure rate
    if (this.state === SYSTEM_STATES.DEGRADED) {
      failureProb += 0.1;
    } else if (this.state === SYSTEM_STATES.DOWN) {
      failureProb += 0.4;
    }

    return this.random.next() < Math.min(failureProb, 0.95);
  }

  calculateLatency() {
    let latency = this.config.baseLatency;
    
    // Add jitter
    const jitter = (this.random.next() * 2 - 1) * this.config.latencyJitter;
    latency += jitter;

    // Queue causes latency increase
    if (this.requestQueue > 0) {
      const queueMultiplier = 1 + (this.requestQueue / this.config.capacity);
      latency *= queueMultiplier;
    }

    // System state affects latency
    if (this.state === SYSTEM_STATES.DEGRADED) {
      latency *= 1.5;
    } else if (this.state === SYSTEM_STATES.DOWN) {
      latency *= 3;
    }

    return Math.max(1, Math.floor(latency));
  }

  calculateBackoff(retryAttempt) {
    const baseDelay = this.config.retry.backoffDelay;
    
    switch (this.config.retry.backoffType) {
      case 'none':
        return 0;
      case 'linear':
        return baseDelay * (retryAttempt + 1);
      case 'exponential':
        return baseDelay * Math.pow(2, retryAttempt);
      default:
        return baseDelay;
    }
  }

  updateCircuitBreaker(currentErrorRate) {
    if (!this.config.circuitBreaker.enabled) return;

    this.recentErrors.push(currentErrorRate);
    if (this.recentErrors.length > this.config.circuitBreaker.windowTicks) {
      this.recentErrors.shift();
    }

    const avgErrorRate = this.recentErrors.reduce((a, b) => a + b, 0) / this.recentErrors.length;

    if (this.circuitState === CIRCUIT_STATES.CLOSED) {
      if (avgErrorRate > this.config.circuitBreaker.errorThreshold) {
        this.circuitState = CIRCUIT_STATES.OPEN;
        this.circuitOpenedAt = this.currentTick;
        this.addEvent(`Circuit opened (error rate ${avgErrorRate.toFixed(1)}% over ${this.recentErrors.length} ticks)`);
      }
    } else if (this.circuitState === CIRCUIT_STATES.OPEN) {
      const ticksSinceOpen = this.currentTick - this.circuitOpenedAt;
      const cooldownTicks = (this.config.circuitBreaker.cooldownTime * 1000) / this.config.tickInterval;
      
      if (ticksSinceOpen >= cooldownTicks) {
        this.circuitState = CIRCUIT_STATES.HALF_OPEN;
        this.halfOpenTestCount = 0;
        this.addEvent('Circuit half-open, testing recovery');
      }
    }
  }

  updateSystemState(metrics) {
    const prevState = this.state;
    
    // State transition logic - based on error rate and capacity utilization
    // These thresholds were tuned through experimentation to create realistic transitions
    if (metrics.errorRate > 50 || this.requestQueue > this.config.capacity * 2) {
      this.state = SYSTEM_STATES.DOWN;
    } else if (metrics.errorRate > 20 || metrics.p95Latency > this.config.baseLatency * 3) {
      this.state = SYSTEM_STATES.DEGRADED;
    } else if (metrics.errorRate < 10 && metrics.p95Latency < this.config.baseLatency * 1.5) {
      this.state = SYSTEM_STATES.STABLE;
    }

    if (prevState !== this.state) {
      this.addEvent(`State transition: ${prevState} → ${this.state}`);
    }

    // Detect retry storm - when retry traffic exceeds original requests
    // This is a key failure mode in distributed systems
    if (metrics.retryCount > metrics.successCount + metrics.failureCount) {
      this.addEvent('Retry storm detected (retries exceed original requests)');
    }
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  addEvent(message) {
    const timeMs = this.currentTick * this.config.tickInterval;
    this.events.push({
      time: timeMs / 1000,
      message
    });
  }

  generateSummary() {
    const totalErrorRate = this.totalRequests > 0 
      ? (this.totalFailures / this.totalRequests) * 100 
      : 0;

    const allLatencies = this.metrics.flatMap(m => 
      Array(m.successCount + m.failureCount).fill(m.avgLatency)
    );

    const downtimeTicks = this.metrics.filter(m => m.systemState === SYSTEM_STATES.DOWN).length;
    const downtimeSec = (downtimeTicks * this.config.tickInterval) / 1000;

    const circuitTrips = this.events.filter(e => e.message.includes('Circuit opened')).length;

    // Determine main cause
    let mainCause = 'System operated normally';
    const avgErrorRate = totalErrorRate;
    const hasRetries = this.config.retry.maxRetries > 0;
    const retryStorms = this.events.filter(e => e.message.includes('Retry storm')).length;

    if (retryStorms > 0 && hasRetries) {
      mainCause = 'Retry storm caused cascading failures and increased load';
    } else if (avgErrorRate > 40) {
      mainCause = 'High base failure rate overwhelmed system capacity';
    } else if (downtimeSec > this.config.duration * 0.3) {
      mainCause = 'Extended downtime due to capacity saturation';
    } else if (circuitTrips > 2) {
      mainCause = 'Multiple circuit breaker trips indicate unstable conditions';
    }

    return {
      totalRequests: this.totalRequests,
      totalSuccesses: this.totalSuccesses,
      totalFailures: this.totalFailures,
      successRate: this.totalRequests > 0 ? (this.totalSuccesses / this.totalRequests) * 100 : 0,
      errorRate: totalErrorRate,
      avgLatency: allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length,
      p95Latency: this.calculatePercentile(allLatencies, 0.95),
      maxLatency: Math.max(...allLatencies),
      downtimeSec,
      circuitTrips,
      mainCause
    };
  }
}
