import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PRESET_SCENARIOS } from '../presets';

export default function ScenarioLibrary() {
  const [scenarios, setScenarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    const res = await fetch('/api/scenarios');
    const data = await res.json();
    setScenarios(data);
  };

  const deleteScenario = async (id) => {
    if (!confirm('Delete this scenario?')) return;
    await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
    fetchScenarios();
  };

  const duplicateScenario = async (id) => {
    await fetch(`/api/scenarios/${id}/duplicate`, { method: 'POST' });
    fetchScenarios();
  };

  const runScenario = async (scenarioId) => {
    const res = await fetch('/api/runs/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId })
    });
    const { runId } = await res.json();
    navigate(`/run/${runId}/live`);
  };

  const createFromPreset = async (preset) => {
    const res = await fetch('/api/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: preset.name, config: preset.config })
    });
    await res.json();
    fetchScenarios();
    setShowPresets(false);
  };

  const filtered = scenarios.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Scenarios</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            {showPresets ? 'Hide Presets' : 'Show Presets'}
          </button>
          <Link 
            to="/scenario/new"
            className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
          >
            Create Scenario
          </Link>
        </div>
      </div>

      {/* Preset Scenarios */}
      {showPresets && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preset Scenarios</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRESET_SCENARIOS.map((preset, idx) => (
              <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-900 mb-3">{preset.name}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-white text-gray-700 text-xs rounded">
                    {preset.config.rps} RPS
                  </span>
                  <span className="px-2 py-1 bg-white text-gray-700 text-xs rounded">
                    Retries {preset.config.retry.maxRetries}
                  </span>
                  {preset.config.circuitBreaker.enabled && (
                    <span className="px-2 py-1 bg-white text-gray-700 text-xs rounded">
                      Breaker ON
                    </span>
                  )}
                </div>
                <button
                  onClick={() => createFromPreset(preset)}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700"
                >
                  Add to Library
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search scenarios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No scenarios yet</p>
          <Link 
            to="/scenario/new"
            className="text-gray-900 font-medium hover:underline"
          >
            Create your first scenario
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(scenario => (
            <div key={scenario.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-3">{scenario.name}</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {scenario.config.rps} RPS
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  Retries {scenario.config.retry.maxRetries}
                </span>
                {scenario.config.circuitBreaker.enabled && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    Breaker ON
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Updated {new Date(scenario.updated_at).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => runScenario(scenario.id)}
                  className="flex-1 bg-gray-900 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-800"
                >
                  Run
                </button>
                <Link
                  to={`/scenario/${scenario.id}/edit`}
                  className="px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
                >
                  Edit
                </Link>
                <button
                  onClick={() => duplicateScenario(scenario.id)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
                >
                  Copy
                </button>
                <button
                  onClick={() => deleteScenario(scenario.id)}
                  className="px-3 py-2 text-red-600 border border-red-300 rounded text-sm font-medium hover:bg-red-50"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
