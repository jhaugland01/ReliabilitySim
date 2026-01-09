# Development Guide

## Architecture Overview

### Backend (Node.js + Express)

**Core Components:**

1. **Simulation Engine** (`server/src/simulator.js`)
   - Deterministic pseudo-random number generator (xorshift)
   - Tick-based processing (250ms/500ms/1s intervals)
   - State machine: STABLE → DEGRADED → DOWN
   - Circuit breaker: CLOSED → OPEN → HALF_OPEN
   - Retry logic with configurable backoff strategies

2. **Database Layer** (`server/src/db.js`)
   - SQLite for lightweight persistence
   - Two tables: scenarios, runs
   - JSON columns for flexible config storage

3. **API Routes**
   - `GET/POST/PUT/DELETE /api/scenarios` - CRUD operations
   - `POST /api/runs/start` - Initialize new simulation
   - `GET /api/runs/:id/stream` - SSE streaming endpoint
   - `POST /api/runs/compare` - Compare two runs

### Frontend (React + Vite)

**Page Structure:**

- `ScenarioLibrary.jsx` - Home page, scenario cards
- `ScenarioBuilder.jsx` - Form-based scenario editor
- `RunLive.jsx` - Real-time SSE consumer with live charts
- `RunReport.jsx` - Post-mortem analysis view
- `CompareRuns.jsx` - Side-by-side run comparison

**Data Flow:**

1. User creates/edits scenario → POST to `/api/scenarios`
2. User clicks "Run" → POST to `/api/runs/start` → Navigate to live view
3. Live view opens EventSource → SSE streams tick data
4. Charts update on each tick → Summary shown on completion
5. User navigates to report → Fetch full run data

## Key Implementation Details

### Deterministic Randomness

```javascript
class Random {
  constructor(seed) {
    this.state = seed || 123456789;
  }
  
  next() {
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x;
    return ((x >>> 0) / 0xffffffff);
  }
}
```

This ensures same seed = same results across runs.

### State Transition Logic

```javascript
updateSystemState(metrics) {
  if (metrics.errorRate > 50 || queue > capacity * 2) {
    this.state = 'down';
  } else if (metrics.errorRate > 20 || p95 > baseLatency * 3) {
    this.state = 'degraded';
  } else if (metrics.errorRate < 10 && p95 < baseLatency * 1.5) {
    this.state = 'stable';
  }
}
```

### SSE Streaming Pattern

```javascript
// Server
res.setHeader('Content-Type', 'text/event-stream');
setInterval(() => {
  const data = processTick();
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}, tickInterval);

// Client
const eventSource = new EventSource('/api/runs/:id/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setMetrics(prev => [...prev, data]);
};
```

## Adding New Features

### Add a New Metric

1. Update `simulator.js` `processTick()` to calculate metric
2. Add to returned metrics object
3. Update frontend chart components to display

### Add a New Retry Strategy

1. Add case to `calculateBackoff()` in `simulator.js`
2. Add option to dropdown in `ScenarioBuilder.jsx`
3. Update preset scenarios if desired

### Add a New Preset Scenario

1. Edit `client/src/presets.js`
2. Add configuration object to `PRESET_SCENARIOS` array
3. Optionally add to `server/src/seed.js` for database seeding

## Performance Considerations

**Tick Interval vs Duration:**
- 250ms ticks × 30s = 120 data points
- 1000ms ticks × 30s = 30 data points
- Smaller intervals = more granular data but more processing

**SSE vs WebSocket:**
- SSE chosen for simplicity (unidirectional)
- No need for client → server messages during simulation
- Browser auto-reconnects on disconnect

**Chart Rendering:**
- Recharts efficiently handles 100+ data points
- `dot={false}` reduces render overhead
- ResponsiveContainer adapts to screen size

## Testing Locally

### Manual Test Scenarios

1. **Retry Storm Detection**
   - Create scenario: RPS 50, capacity 10, retries 4, linear backoff
   - Expect: Event log shows "Retry storm detected"

2. **Circuit Breaker Trip**
   - Create scenario: High failure rate (15%+), breaker enabled
   - Expect: Circuit opens, half-open test, then closes or re-opens

3. **Capacity Saturation**
   - Create scenario: RPS 100, capacity 10
   - Expect: Queue builds, latency spikes, state → DOWN

4. **Comparison Analysis**
   - Run scenario A with retries=0
   - Run scenario B with retries=3
   - Compare: Should show retry impact on latency/downtime

## Database Schema

### scenarios table
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
config TEXT NOT NULL  -- JSON string
created_at INTEGER NOT NULL
updated_at INTEGER NOT NULL
```

### runs table
```sql
id TEXT PRIMARY KEY
scenario_id TEXT NOT NULL
seed INTEGER NOT NULL
status TEXT NOT NULL  -- 'running' | 'completed' | 'failed'
duration INTEGER NOT NULL
tick_interval INTEGER NOT NULL
summary TEXT  -- JSON string, null until complete
events TEXT  -- JSON array of event objects
metrics TEXT  -- JSON array of tick metrics
started_at INTEGER
completed_at INTEGER
```

## Debugging Tips

**Server not streaming:**
- Check browser console for EventSource errors
- Verify SSE headers are set correctly
- Test endpoint with `curl` or Postman

**Charts not updating:**
- Check React state updates in dev tools
- Verify data format matches Recharts expectations
- Look for console errors in browser

**Simulation results unexpected:**
- Log metrics to console in `processTick()`
- Verify config values are parsed correctly
- Check seed value for determinism

**Database locked errors:**
- Close connections properly after queries
- Use `better-sqlite3` synchronous API correctly
- Avoid concurrent writes from multiple processes

## Code Style

- Use functional React components with hooks
- Prefer descriptive variable names over abbreviations
- Keep functions under 50 lines when possible
- Comment complex logic (e.g., state transitions)
- Use Tailwind utility classes, avoid custom CSS

## Deployment Considerations

**Production Build:**
```bash
cd client
npm run build
# Serve static files from server/public
```

**Environment Variables:**
- `PORT` for server (default 3001)
- `DATABASE_PATH` for SQLite location
- `NODE_ENV=production` for optimizations

**Security:**
- Add rate limiting for API endpoints
- Validate all user inputs
- Sanitize scenario names
- Consider adding auth for multi-user deployments

## Contributing

This is a portfolio project, but if extending:

1. Keep determinism intact (no random seeds without user control)
2. Maintain explainability (every metric/event should have context)
3. Test across different scenario configs
4. Update README with new features
