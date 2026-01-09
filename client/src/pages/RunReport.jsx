import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RunReport() {
  const { id } = useParams();
  const [run, setRun] = useState(null);
  const [scenario, setScenario] = useState(null);

  useEffect(() => {
    fetch(`/api/runs/${id}`)
      .then(res => res.json())
      .then(data => {
        setRun(data);
        return fetch(`/api/scenarios/${data.scenario_id}`);
      })
      .then(res => res.json())
      .then(data => setScenario(data));
  }, [id]);

  if (!run || !scenario) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  const chartData = run.metrics.map(m => ({
    time: m.time.toFixed(1),
    success: m.successCount,
    failure: m.failureCount,
    p95: m.p95Latency,
    errorRate: m.errorRate
  }));

  const copyToClipboard = () => {
    const text = `
Reliability Simulation Report
Scenario: ${scenario.name}
Duration: ${run.duration}s

Results:
- Total Requests: ${run.summary.totalRequests}
- Success Rate: ${run.summary.successRate.toFixed(1)}%
- Error Rate: ${run.summary.errorRate.toFixed(1)}%
- Avg Latency: ${run.summary.avgLatency.toFixed(0)}ms
- p95 Latency: ${run.summary.p95Latency.toFixed(0)}ms
- Max Latency: ${run.summary.maxLatency.toFixed(0)}ms
- Downtime: ${run.summary.downtimeSec.toFixed(1)}s
- Circuit Breaker Trips: ${run.summary.circuitTrips}

Analysis: ${run.summary.mainCause}
    `.trim();
    
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block">
            ← Back to scenarios
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Run Report</h1>
          <p className="text-gray-600">{scenario.name}</p>
        </div>
        <button
          onClick={copyToClipboard}
          className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
        >
          Copy Summary
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Total Requests</div>
          <div className="text-2xl font-bold text-gray-900">{run.summary.totalRequests}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-gray-900">{run.summary.successRate.toFixed(1)}%</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Error Rate</div>
          <div className="text-2xl font-bold text-gray-900">{run.summary.errorRate.toFixed(1)}%</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">p95 Latency</div>
          <div className="text-2xl font-bold text-gray-900">{run.summary.p95Latency.toFixed(0)}ms</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Avg Latency</div>
          <div className="text-2xl font-bold text-gray-900">{run.summary.avgLatency.toFixed(0)}ms</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Max Latency</div>
          <div className="text-2xl font-bold text-gray-900">{run.summary.maxLatency.toFixed(0)}ms</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Downtime</div>
          <div className="text-2xl font-bold text-gray-900">{run.summary.downtimeSec.toFixed(1)}s</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Circuit Trips</div>
          <div className="text-2xl font-bold text-gray-900">{run.summary.circuitTrips}</div>
        </div>
      </div>

      {/* Main Cause */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-2">Analysis</h3>
        <p className="text-gray-700">{run.summary.mainCause}</p>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Success vs Failure</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="failure" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">p95 Latency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="p95" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Error Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="errorRate" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Event Log */}
      {run.events && run.events.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Event Timeline</h3>
          <div className="space-y-2 text-sm">
            {run.events.map((event, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="text-gray-500 font-mono text-xs">[{event.time.toFixed(1)}s]</span>
                <span className="text-gray-700">{event.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
