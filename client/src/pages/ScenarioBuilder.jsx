import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PRESET_SCENARIOS } from '../presets';

const defaultConfig = {
  rps: 40,
  duration: 30,
  tickInterval: 250,
  baseLatency: 50,
  latencyJitter: 20,
  capacity: 15,
  baseFailureProbability: 0.08,
  retry: {
    maxRetries: 2,
    backoffType: 'exponential',
    backoffDelay: 100
  },
  circuitBreaker: {
    enabled: true,
    errorThreshold: 35,
    windowTicks: 8,
    cooldownTime: 5
  }
};

export default function ScenarioBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/scenarios/${id}`)
        .then(res => res.json())
        .then(data => {
          setName(data.name);
          setConfig(data.config);
        });
    }
  }, [id]);

  const loadPreset = (preset) => {
    setName(preset.name);
    setConfig(preset.config);
    setShowPresets(false);
  };

  const updateConfig = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const save = async (andRun = false) => {
    setLoading(true);
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/scenarios/${id}` : '/api/scenarios';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, config })
    });
    
    const data = await res.json();
    const scenarioId = id || data.id;

    if (andRun) {
      const runRes = await fetch('/api/runs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });
      const { runId } = await runRes.json();
      navigate(`/run/${runId}/live`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Form Controls */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Edit Scenario' : 'New Scenario'}
            </h1>
            {!id && (
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {showPresets ? 'Hide' : 'Load'} Preset
              </button>
            )}
          </div>

          {/* Preset Dropdown */}
          {showPresets && !id && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Load from Preset
              </label>
              <div className="space-y-2">
                {PRESET_SCENARIOS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPreset(preset)}
                    className="w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scenario Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g., High Traffic with Retries"
              />
            </div>

            {/* Load Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Load</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    RPS: {config.rps}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={config.rps}
                    onChange={(e) => updateConfig('rps', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Duration (seconds): {config.duration}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    value={config.duration}
                    onChange={(e) => updateConfig('duration', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Tick Interval (ms)
                  </label>
                  <select
                    value={config.tickInterval}
                    onChange={(e) => updateConfig('tickInterval', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="250">250ms</option>
                    <option value="500">500ms</option>
                    <option value="1000">1 second</option>
                  </select>
                </div>
              </div>
            </div>

            {/* System Behavior */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">System Behavior</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Base Latency (ms): {config.baseLatency}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    value={config.baseLatency}
                    onChange={(e) => updateConfig('baseLatency', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Latency Jitter (ms): {config.latencyJitter}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.latencyJitter}
                    onChange={(e) => updateConfig('latencyJitter', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Capacity (req/tick): {config.capacity}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={config.capacity}
                    onChange={(e) => updateConfig('capacity', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Base Failure Rate (%): {(config.baseFailureProbability * 100).toFixed(0)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={config.baseFailureProbability * 100}
                    onChange={(e) => updateConfig('baseFailureProbability', parseInt(e.target.value) / 100)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Retry Policy */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Retry Policy</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Max Retries: {config.retry.maxRetries}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={config.retry.maxRetries}
                    onChange={(e) => updateConfig('retry.maxRetries', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Backoff Type
                  </label>
                  <select
                    value={config.retry.backoffType}
                    onChange={(e) => updateConfig('retry.backoffType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="none">None</option>
                    <option value="linear">Linear</option>
                    <option value="exponential">Exponential</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Base Backoff Delay (ms): {config.retry.backoffDelay}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="50"
                    value={config.retry.backoffDelay}
                    onChange={(e) => updateConfig('retry.backoffDelay', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Circuit Breaker */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Circuit Breaker</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.circuitBreaker.enabled}
                    onChange={(e) => updateConfig('circuitBreaker.enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Enable</span>
                </label>
              </div>

              {config.circuitBreaker.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Open Threshold (%): {config.circuitBreaker.errorThreshold}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      value={config.circuitBreaker.errorThreshold}
                      onChange={(e) => updateConfig('circuitBreaker.errorThreshold', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Window (ticks): {config.circuitBreaker.windowTicks}
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="20"
                      value={config.circuitBreaker.windowTicks}
                      onChange={(e) => updateConfig('circuitBreaker.windowTicks', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Cooldown (seconds): {config.circuitBreaker.cooldownTime}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={config.circuitBreaker.cooldownTime}
                      onChange={(e) => updateConfig('circuitBreaker.cooldownTime', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                onClick={() => save(false)}
                disabled={!name || loading}
                className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => save(true)}
                disabled={!name || loading}
                className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                Save & Run
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Scenario Preview</h3>
            <div className="text-sm text-gray-700 space-y-2 leading-relaxed">
              <p>
                This scenario simulates <strong>{config.rps} RPS</strong> for <strong>{config.duration} seconds</strong> with {(config.baseFailureProbability * 100).toFixed(0)}% base failure rate.
              </p>
              <p>
                System capacity is <strong>{config.capacity} requests per tick</strong> ({config.tickInterval}ms ticks).
              </p>
              <p>
                Retry policy: <strong>{config.retry.maxRetries} retries</strong> with <strong>{config.retry.backoffType}</strong> backoff starting at {config.retry.backoffDelay}ms.
              </p>
              {config.circuitBreaker.enabled ? (
                <p>
                  Circuit breaker <strong>enabled</strong>, opens when error rate exceeds {config.circuitBreaker.errorThreshold}% over {config.circuitBreaker.windowTicks} ticks, cooldown {config.circuitBreaker.cooldownTime}s.
                </p>
              ) : (
                <p>
                  Circuit breaker <strong>disabled</strong>.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
