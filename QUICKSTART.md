# Quick Start Guide

## First Time Setup

1. **Install Dependencies**

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

2. **Start the Application**

```bash
# From project root - runs both server and client concurrently
npm run dev
```

The server will start on `http://localhost:3001`  
The client will start on `http://localhost:3000`

3. **Open Browser**

Navigate to `http://localhost:3000`

## Your First Simulation

1. Click "Show Presets" to see example scenarios
2. Click "Add to Library" on "Healthy System"
3. Click "Run" on the newly created scenario
4. Watch the live simulation execute
5. When complete, view the full report
6. Try "Retry Storm" preset and compare the results

## Creating Custom Scenarios

1. Click "Create Scenario"
2. Name your scenario
3. Adjust sliders for:
   - Load (RPS, duration)
   - System behavior (latency, capacity, failure rate)
   - Retry policy
   - Circuit breaker settings
4. Preview updates in real-time on the right
5. Click "Save & Run" to execute immediately

## Understanding Results

**System States:**
- 🟢 Stable: Everything healthy
- 🟡 Degraded: Rising errors or latency
- 🔴 Down: System overwhelmed

**Key Metrics:**
- Error Rate: % of failed requests
- p95 Latency: 95th percentile response time
- Downtime: Seconds spent in DOWN state
- Circuit Trips: How many times breaker opened

## Tips

- **Deterministic Runs**: Same scenario = same results (seeded RNG)
- **Compare Runs**: Change one parameter, compare outcomes
- **Event Log**: Shows why state transitions happened
- **Copy Summary**: Share results in Slack/Jira format

## Troubleshooting

**Server won't start:**
- Check if port 3001 is already in use
- Make sure Node.js v16+ is installed

**Client won't start:**
- Check if port 3000 is already in use
- Try `cd client && npm install` again

**Database issues:**
- Delete `server/reliability.db` to reset
- It will be recreated on next server start

## Next Steps

- Experiment with different retry strategies
- Test how circuit breakers prevent cascading failures
- Model your own production systems
- Compare scenarios to find optimal settings
