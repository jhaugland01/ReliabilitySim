# Setup Verification Checklist

Use this checklist to verify your Reliability Simulator installation is working correctly.

## Pre-Installation Checks

- [ ] Node.js v16+ installed (`node --version`)
- [ ] NPM installed (`npm --version`)
- [ ] Ports 3000 and 3001 are available
- [ ] At least 100MB free disk space

## Installation Steps

- [ ] Run `install.bat` or manual installation
- [ ] No errors during npm install
- [ ] All three package.json files have node_modules:
  - [ ] Root: `node_modules/` exists
  - [ ] Server: `server/node_modules/` exists
  - [ ] Client: `client/node_modules/` exists

## Server Verification

- [ ] Run `npm run dev` or `start.bat`
- [ ] Server starts without errors
- [ ] See "Server running on http://localhost:3001"
- [ ] Database file created: `server/reliability.db`
- [ ] Open http://localhost:3001 - should see "Cannot GET /"

## Client Verification

- [ ] Client starts without errors
- [ ] See "Local: http://localhost:3000"
- [ ] Open http://localhost:3000 - UI loads
- [ ] Navigation bar shows "Reliability Sim"
- [ ] "Scenarios" and "Compare" tabs visible

## Feature Verification

### Scenario Library
- [ ] Page loads without errors
- [ ] "Create Scenario" button visible
- [ ] "Show Presets" button works
- [ ] Preset scenarios appear (5 cards)
- [ ] Can add preset to library

### Scenario Builder
- [ ] Click "Create Scenario"
- [ ] Form controls work (sliders, inputs)
- [ ] Preview panel updates on right side
- [ ] Can enter scenario name
- [ ] "Save" button enabled when name entered
- [ ] Saving creates new scenario

### Run Simulation
- [ ] Click "Run" on a scenario
- [ ] Redirects to Live Run view
- [ ] "Starting simulation..." appears
- [ ] Within 1 second, KPI cards populate
- [ ] Charts start updating
- [ ] Event log shows events
- [ ] After duration, shows "Completed"
- [ ] "View Full Report" button appears

### Run Report
- [ ] Click "View Full Report"
- [ ] Summary cards show metrics
- [ ] "Analysis" section shows main cause
- [ ] Charts render correctly
- [ ] Event timeline visible
- [ ] "Copy Summary" button works
- [ ] Clicking copies text to clipboard

### Compare Runs
- [ ] Navigate to "Compare" tab
- [ ] Can select a scenario
- [ ] Dropdown shows completed runs
- [ ] Can select Run A and Run B
- [ ] "Compare" button works
- [ ] KPI comparison appears
- [ ] Overlay charts render
- [ ] Impact analysis shows differences

## Common Test Scenarios

### Test 1: Healthy System
- [ ] Add "Healthy System" preset
- [ ] Run simulation
- [ ] Verify: Low error rate (2-5%)
- [ ] Verify: System stays STABLE
- [ ] Verify: Minimal downtime

### Test 2: Retry Storm
- [ ] Add "Retry Storm" preset
- [ ] Run simulation
- [ ] Verify: Event log shows "Retry storm detected"
- [ ] Verify: Error rate climbs (40%+)
- [ ] Verify: System goes DOWN
- [ ] Verify: Extended downtime

### Test 3: Circuit Breaker
- [ ] Add "Circuit Breaker Saves You" preset
- [ ] Run simulation
- [ ] Verify: Circuit opens (event log)
- [ ] Verify: Half-open test occurs
- [ ] Verify: Circuit closes or re-opens
- [ ] Verify: Multiple state transitions

### Test 4: Determinism
- [ ] Run same scenario twice (don't change anything)
- [ ] Note: Different seeds = different results (expected)
- [ ] To test determinism: Would need to use same seed manually

### Test 5: Comparison
- [ ] Create custom scenario
- [ ] Run it with retries = 0
- [ ] Edit scenario, set retries = 3
- [ ] Run again
- [ ] Go to Compare
- [ ] Select both runs
- [ ] Verify: Shows differences in retry config
- [ ] Verify: Impact analysis mentions retries

## Performance Checks

- [ ] Simulation runs in real-time (30s scenario takes ~30s)
- [ ] Charts update smoothly
- [ ] No browser freezing
- [ ] Memory usage reasonable (<500MB)
- [ ] CPU usage normal during simulation

## Browser Compatibility

Test in at least one of:
- [ ] Chrome/Edge (recommended)
- [ ] Firefox
- [ ] Safari

## Database Checks

- [ ] File exists: `server/reliability.db`
- [ ] Can view with SQLite browser (optional)
- [ ] Deleting it and restarting regenerates it
- [ ] Run `cd server && npm run seed` to populate presets

## Troubleshooting

If any checks fail, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

Common fixes:
- Hard refresh browser: Ctrl+Shift+R
- Restart dev servers
- Clear npm cache: `npm cache clean --force`
- Delete `server/reliability.db`
- Reinstall dependencies

## Final Verification

- [ ] All core features work
- [ ] No console errors in browser
- [ ] No server errors in terminal
- [ ] Documentation files present
- [ ] Ready for demonstration

## Next Steps

Once everything passes:

1. ✅ Add to portfolio
2. ✅ Push to GitHub
3. ✅ Add screenshots to README
4. ✅ Practice demo presentation
5. ✅ Prepare talking points for interviews

---

**Checklist Complete?** 🎉

You now have a fully functional Reliability Simulator ready for your resume and portfolio!
