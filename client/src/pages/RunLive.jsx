import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const stateColors = {
  stable: 'bg-sys-stable text-white',
  degraded: 'bg-sys-degraded text-white',
  down: 'bg-sys-down text-white'
};

export default function RunLive() {
  const { id } = useParams();
  const [metrics, setMetrics] = useState([]);
  const [events, setEvents] = useState([]);
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('running');

  useEffect(() => {
    const eventSource = new EventSource(`/api/runs/${id}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'tick') {
        setMetrics(prev => [...prev, data.data]);
        setCurrentMetrics(data.data);
        
        // Update events from server
        if (data.events && data.events.length > events.length) {
          setEvents(data.events);
        }
      } else if (data.type === 'complete') {
        setSummary(data.summary);
        setStatus('completed');
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setStatus('error');
      eventSource.close();
    };

    return () => eventSource.close();
  }, [id]);

  if (!currentMetrics && status === 'running') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Starting simulation...</p>
        </div>
      </div>
    );
  }

  const chartData = metrics.map(m => ({
    time: m.time.toFixed(1),
    success: m.successCount,
    failure: m.failureCount,
    p95: m.p95Latency,
    errorRate: m.errorRate
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Live Run</h1>
        {status === 'running' && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Running...
          </div>
        )}
        {status === 'completed' && (
          <div className="text-sm text-gray-600">Completed</div>
        )}
      </div>

      {/* KPI Cards */}
      {currentMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">State</div>
            <div>
              <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${stateColors[currentMetrics.systemState]}`}>
                {currentMetrics.systemState.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Error Rate</div>
            <div className="text-2xl font-bold text-gray-900">
              {currentMetrics.errorRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">p95 Latency</div>
            <div className="text-2xl font-bold text-gray-900">
              {currentMetrics.p95Latency.toFixed(0)}ms
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Requests/sec</div>
            <div className="text-2xl font-bold text-gray-900">
              {currentMetrics.requestsPerSec.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Success vs Failure</h3>
          <ResponsiveContainer width="100%" height={250}>
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
          <h3 className="font-semibold text-gray-900 mb-4">p95 Latency Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
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

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Error Rate Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
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

        {/* Event Log */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Event Log</h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto text-sm">
            {events.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No events yet</div>
            ) : (
              events.slice().reverse().map((event, idx) => (
                <div key={idx} className="flex gap-2 text-xs">
                  <span className="text-gray-500 font-mono">[{event.time.toFixed(1)}s]</span>
                  <span className="text-gray-700">{event.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary (when complete) */}
      {summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Run Complete</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-xl font-bold text-gray-900">{summary.successRate.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Avg Latency</div>
              <div className="text-xl font-bold text-gray-900">{summary.avgLatency.toFixed(0)}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Downtime</div>
              <div className="text-xl font-bold text-gray-900">{summary.downtimeSec.toFixed(1)}s</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium text-gray-700 mb-2">Main Cause:</div>
            <div className="text-sm text-gray-600">{summary.mainCause}</div>
          </div>
          <div className="mt-6">
            <a 
              href={`/run/${id}/report`}
              className="inline-block bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
            >
              View Full Report
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
