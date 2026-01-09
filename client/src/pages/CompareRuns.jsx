import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CompareRuns() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [runs, setRuns] = useState([]);
  const [runA, setRunA] = useState('');
  const [runB, setRunB] = useState('');
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    fetch('/api/scenarios')
      .then(res => res.json())
      .then(data => setScenarios(data));
  }, []);

  useEffect(() => {
    if (selectedScenario) {
      fetch(`/api/runs/scenario/${selectedScenario}`)
        .then(res => res.json())
        .then(data => setRuns(data.filter(r => r.status === 'completed')));
    }
  }, [selectedScenario]);

  const compare = async () => {
    if (!runA || !runB) return;

    const res = await fetch('/api/runs/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runIdA: runA, runIdB: runB })
    });
    const data = await res.json();
    setComparison(data);
  };

  const mergeChartData = () => {
    if (!comparison) return [];
    
    const maxLength = Math.max(comparison.runA.metrics.length, comparison.runB.metrics.length);
    const merged = [];
    
    for (let i = 0; i < maxLength; i++) {
      const metricA = comparison.runA.metrics[i];
      const metricB = comparison.runB.metrics[i];
      
      merged.push({
        time: metricA?.time?.toFixed(1) || metricB?.time?.toFixed(1) || i,
        errorRateA: metricA?.errorRate || 0,
        errorRateB: metricB?.errorRate || 0,
        p95A: metricA?.p95Latency || 0,
        p95B: metricB?.p95Latency || 0
      });
    }
    
    return merged;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Compare Runs</h1>

      {/* Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Scenario
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => {
                setSelectedScenario(e.target.value);
                setRunA('');
                setRunB('');
                setComparison(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose a scenario...</option>
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Run A
            </label>
            <select
              value={runA}
              onChange={(e) => setRunA(e.target.value)}
              disabled={!selectedScenario || runs.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            >
              <option value="">Select run...</option>
              {runs.map(r => (
                <option key={r.id} value={r.id}>
                  {new Date(r.started_at).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Run B
            </label>
            <select
              value={runB}
              onChange={(e) => setRunB(e.target.value)}
              disabled={!selectedScenario || runs.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            >
              <option value="">Select run...</option>
              {runs.map(r => (
                <option key={r.id} value={r.id}>
                  {new Date(r.started_at).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={compare}
          disabled={!runA || !runB}
          className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          Compare
        </button>
      </div>

      {/* Results */}
      {comparison && (
        <>
          {/* Differences */}
          {comparison.differences.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Configuration Differences</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                {comparison.differences.map((diff, idx) => (
                  <li key={idx}>• {diff}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Analysis */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Impact Analysis</h3>
            <p className="text-sm text-gray-700">{comparison.analysis}</p>
          </div>

          {/* Side-by-side KPIs */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">KPI Comparison</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Run A */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-3">Run A</div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-semibold">{comparison.runA.summary.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="font-semibold">{comparison.runA.summary.errorRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">p95 Latency</span>
                    <span className="font-semibold">{comparison.runA.summary.p95Latency.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Latency</span>
                    <span className="font-semibold">{comparison.runA.summary.avgLatency.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Downtime</span>
                    <span className="font-semibold">{comparison.runA.summary.downtimeSec.toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Circuit Trips</span>
                    <span className="font-semibold">{comparison.runA.summary.circuitTrips}</span>
                  </div>
                </div>
              </div>

              {/* Run B */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-3">Run B</div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-semibold">{comparison.runB.summary.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="font-semibold">{comparison.runB.summary.errorRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">p95 Latency</span>
                    <span className="font-semibold">{comparison.runB.summary.p95Latency.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Latency</span>
                    <span className="font-semibold">{comparison.runB.summary.avgLatency.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Downtime</span>
                    <span className="font-semibold">{comparison.runB.summary.downtimeSec.toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Circuit Trips</span>
                    <span className="font-semibold">{comparison.runB.summary.circuitTrips}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Error Rate Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mergeChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="errorRateA" name="Run A" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="errorRateB" name="Run B" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">p95 Latency Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mergeChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="p95A" name="Run A" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p95B" name="Run B" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {!comparison && selectedScenario && runs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No completed runs for this scenario yet. Run a scenario first.
        </div>
      )}
    </div>
  );
}
