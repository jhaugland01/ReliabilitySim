# Reliability Simulator Lab

A full-stack web application for designing and running reliability experiments on distributed systems. Configure load scenarios with traffic patterns, failure modes, retry policies, and circuit breakers—then watch live as the system transitions between stable, degraded, and down states.

## What It Does

This simulator lets you model real-world reliability patterns in a controlled, deterministic environment. Create scenarios that define how a system behaves under load, run simulations that generate reproducible results (via seeded randomness), and analyze the impact of different reliability strategies on error rates, latency, and downtime. Compare runs side-by-side to understand tradeoffs between retry aggressiveness, circuit breaker thresholds, and capacity limits.

## Key Features

- **Scenario Builder**: Configure RPS, failure rates, latency characteristics, retry policies (linear/exponential backoff), and circuit breaker thresholds through an intuitive UI
- **Live Simulation View**: Stream real-time metrics as the simulation runs, watch state transitions happen, and see when circuit breakers open or close
- **Deterministic Runs**: Seeded randomness ensures identical scenarios produce identical results—critical for A/B testing reliability strategies
- **Explainable Results**: Every run generates a "main cause" analysis explaining what drove the system into degraded or down states
- **Run Comparison**: Select two runs and see side-by-side KPIs, overlaid charts, and auto-generated impact analysis
- **Preset Scenarios**: Pre-built scenarios like "Retry Storm", "Circuit Breaker Saves You", and "Capacity Saturation" demonstrate key reliability concepts

## Reliability Concepts Modeled

### System States
The simulation models three distinct states with rule-based transitions:
- **Stable**: Low error rate, healthy latency
- **Degraded**: Rising errors or latency exceeds baseline by 1.5x+
- **Down**: Error rate > 50%, circuit open, or queue depth exceeds 2x capacity

### Retry & Backoff Strategies
- **None**: No retries, fail fast
- **Linear Backoff**: Fixed incremental delays between retries
- **Exponential Backoff**: Doubling delays to reduce retry storm risk

The simulator tracks when retry traffic exceeds original request volume, flagging potential retry storms that cascade failures.

### Circuit Breaker
Implements a realistic three-state breaker:
- **Closed**: Normal operation
- **Open**: Fast-fail requests during cooldown period
- **Half-Open**: Test traffic to confirm recovery

Configurable error threshold, sliding window size, and cooldown duration.

### Capacity & Saturation
As incoming RPS approaches or exceeds per-tick capacity:
- Request queue builds
- Latency increases proportionally
- Failure probability rises

This creates realistic feedback loops where saturation causes degradation, which triggers retries, which increases saturation.

## Why Seeded Runs Matter

Every simulation uses a pseudo-random number generator (xorshift) initialized with a seed. Same scenario + same seed = identical metrics every time. This enables:
- Controlled A/B testing (change one parameter, compare outcomes)
- Reproducible bug reports
- Fair benchmarking across different strategies

## Tech Stack

**Backend**: Node.js + Express + SQLite + better-sqlite3  
**Frontend**: React + Vite + React Router + Recharts  
**Real-time**: Server-Sent Events (SSE) for live metric streaming  
**Styling**: Tailwind CSS (custom-configured to avoid generic AI aesthetics)

## Project Structure

```
ReliabilitySim/
├── server/
│   ├── src/
│   │   ├── index.js          # Express app setup
│   │   ├── db.js             # SQLite initialization
│   │   ├── simulator.js      # Core simulation engine
│   │   └── routes/
│   │       ├── scenarios.js  # Scenario CRUD
│   │       └── runs.js       # Run execution + SSE streaming
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── ScenarioLibrary.jsx
│   │   │   ├── ScenarioBuilder.jsx
│   │   │   ├── RunLive.jsx
│   │   │   ├── RunReport.jsx
│   │   │   └── CompareRuns.jsx
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   └── presets.js        # Preset scenario definitions
│   └── package.json
└── package.json              # Root orchestration
```

## Getting Started

### Quick Installation (Windows)

```bash
# Double-click install.bat or run:
install.bat

# Then start the app:
start.bat
```

### Manual Installation

```bash
# Install all dependencies (root, server, client)
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### Running the App

```bash
# From project root - runs both server (3001) and client (3000)
npm run dev
```

Then open http://localhost:3000

### Optional: Seed Database with Presets

```bash
cd server
npm run seed
```

### Database

SQLite database is created automatically on first server start at `server/reliability.db`.

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get up and running in 5 minutes
- **[SCENARIOS.md](SCENARIOS.md)** - Detailed explanation of preset scenarios and expected outcomes
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Architecture, implementation details, and contribution guide
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

## Usage Flow

1. **Create a Scenario**: Use preset scenarios or build custom configs with the scenario builder
2. **Run Simulation**: Click "Run" to start a deterministic simulation
3. **Watch Live**: Monitor real-time state changes, error rates, and latency spikes
4. **Analyze Results**: View post-run summary with charts and event timeline
5. **Compare Runs**: Select two runs to see KPI differences and auto-generated impact analysis

## Tradeoffs & Design Decisions

### Why SSE instead of WebSockets?
Server-Sent Events are simpler for unidirectional streaming (server → client). No need for bi-directional communication since simulations run autonomously once started.

### Why SQLite?
Lightweight, zero-config persistence perfect for local/demo deployments. Easy to inspect with standard SQL tools.

### Why tick-based simulation?
Fixed time intervals (250ms/500ms/1s) make state transitions predictable and metrics easier to visualize. Real-world telemetry is often bucketed similarly.

### Why client-side charts instead of server rendering?
Recharts provides responsive, interactive visualizations that update smoothly during live runs. Server-side rendering would require websockets for chart updates.

## Future Enhancements

- **Share Links**: Generate read-only URLs for specific run reports
- **Multi-service Scenarios**: Model upstream/downstream dependencies
- **Custom Failure Injection**: Trigger outages at specific timestamps
- **Authentication**: PIN-based access for enterprise deployments
- **Export Formats**: JSON, CSV, or Prometheus-compatible metric dumps
- **Advanced Queueing**: Model different queue eviction policies (FIFO, priority)
- **Real Telemetry Ingestion**: Import actual metrics and replay with different policies

## Development

### Running Tests
(Tests not yet implemented—this is a portfolio project focused on demonstrating concepts)

### Build for Production
```bash
cd client
npm run build
# Serve static files from server with express.static
```

## Screenshots

(Add screenshots here after running the app)

1. **Scenario Library**: Card-based view with search and preset scenarios
2. **Scenario Builder**: Split view with form controls and live preview
3. **Live Run**: Real-time charts updating as simulation executes
4. **Run Report**: Post-mortem analysis with copyable summary
5. **Compare View**: Side-by-side KPI comparison with impact analysis

## License

MIT

## Author

Built to demonstrate understanding of distributed systems reliability, real-time web applications, and full-stack development practices.
#   R e l i a b i l i t y S i m  
 