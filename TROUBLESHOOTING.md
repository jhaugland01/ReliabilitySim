# Troubleshooting Guide

## Installation Issues

### "npm install" fails

**Symptoms:**
- Error messages during `npm install`
- Missing dependencies warnings

**Solutions:**
1. Ensure Node.js v16+ is installed: `node --version`
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and `package-lock.json`, then reinstall
4. Try with administrator privileges (Windows)

### "better-sqlite3" compilation errors

**Symptoms:**
- Native module build failures
- Python or Visual Studio errors

**Solutions:**
1. Install Windows Build Tools: `npm install --global windows-build-tools`
2. Or install Visual Studio Build Tools manually
3. Ensure Python 3.x is in PATH
4. Restart terminal after installing build tools

---

## Server Issues

### Server won't start

**Symptoms:**
- "Port 3001 already in use"
- Server crashes on startup

**Solutions:**
1. Check if another process uses port 3001:
   ```powershell
   netstat -ano | findstr :3001
   ```
2. Kill the process or change port in `server/src/index.js`
3. Check for syntax errors in server files
4. Verify SQLite database isn't corrupted: delete `server/reliability.db`

### Database errors

**Symptoms:**
- "SQLITE_BUSY" or "database is locked"
- "no such table" errors

**Solutions:**
1. Delete `server/reliability.db` - it will regenerate
2. Run `cd server && npm run seed` to populate presets
3. Ensure only one server instance is running
4. Check file permissions on database file

### SSE streaming not working

**Symptoms:**
- Live view shows "Starting simulation..." forever
- EventSource errors in browser console

**Solutions:**
1. Check browser console for CORS errors
2. Verify server is running: `http://localhost:3001`
3. Test SSE endpoint manually: `curl http://localhost:3001/api/runs/{id}/stream`
4. Check run status in database - must be "running"
5. Try a different browser (Chrome/Edge recommended)

---

## Client Issues

### Client won't start

**Symptoms:**
- "Port 3000 already in use"
- Vite build errors

**Solutions:**
1. Check if port 3000 is in use
2. Clear Vite cache: delete `client/.vite` folder
3. Reinstall client dependencies: `cd client && npm install`
4. Check for syntax errors in React components

### Blank screen / White screen

**Symptoms:**
- Browser shows empty page
- No errors in console

**Solutions:**
1. Check browser console for errors
2. Verify server is running on port 3001
3. Check Vite proxy configuration in `client/vite.config.js`
4. Hard refresh browser: Ctrl+Shift+R
5. Clear browser cache

### Charts not rendering

**Symptoms:**
- Data loads but charts are blank
- Recharts errors in console

**Solutions:**
1. Verify `recharts` is installed: `cd client && npm list recharts`
2. Check that metrics data has correct structure
3. Look for null/undefined values in data
4. Test with preset scenarios (known good data)

### API calls fail (404/500 errors)

**Symptoms:**
- Network errors in console
- "Failed to fetch" messages

**Solutions:**
1. Verify server is running: `http://localhost:3001`
2. Check Vite proxy settings
3. Inspect Network tab in browser dev tools
4. Test API directly: `curl http://localhost:3001/api/scenarios`
5. Check CORS configuration in server

---

## Simulation Issues

### Results seem random (not deterministic)

**Symptoms:**
- Same scenario produces different results each run
- Can't reproduce specific outcomes

**Solutions:**
1. Check that seed is being used: inspect run record in database
2. Verify `Random` class is using seed correctly
3. Don't modify scenario between runs
4. Use same seed for comparison (check run details)

### Simulation never completes

**Symptoms:**
- Live view runs indefinitely
- No "complete" event received

**Solutions:**
1. Check server logs for errors during tick processing
2. Verify `totalTicks` calculation is correct
3. Check for infinite loops in state machine
4. Kill run and check database - may be marked "running"
5. Manually update run status to "failed" in database

### Metrics look wrong

**Symptoms:**
- Error rate is 0% or 100% always
- Latency values are unrealistic
- State never changes from STABLE

**Solutions:**
1. Verify config values are sensible:
   - RPS > 0
   - Capacity > 0
   - Base failure probability between 0-1
2. Check tick interval isn't too large/small
3. Inspect `processTick()` logic for bugs
4. Test with known-good preset scenarios
5. Log metrics to console during simulation

### Circuit breaker never opens

**Symptoms:**
- High error rates but breaker stays CLOSED
- No circuit events in log

**Solutions:**
1. Verify circuit breaker is enabled in config
2. Check error threshold isn't too high (>80%)
3. Ensure window size isn't too small
4. Check that `recentErrors` array is populated
5. Review `updateCircuitBreaker()` logic

---

## Performance Issues

### Slow simulation execution

**Symptoms:**
- Ticks take longer than configured interval
- UI becomes unresponsive

**Solutions:**
1. Increase tick interval (250ms → 1000ms)
2. Reduce duration (60s → 30s)
3. Simplify retry logic (fewer retries)
4. Check CPU usage - other processes may interfere
5. Use Chrome/Edge for better performance

### Memory leaks during long runs

**Symptoms:**
- Browser becomes slow over time
- Memory usage climbs

**Solutions:**
1. Ensure EventSource is closed on component unmount
2. Check for leaked interval/timeout handles
3. Limit metrics array size (remove old data points)
4. Close unused runs/tabs
5. Restart browser

---

## Data Issues

### Scenarios won't save

**Symptoms:**
- Save button does nothing
- Network errors on save

**Solutions:**
1. Check that scenario name is not empty
2. Verify all config values are valid numbers
3. Check browser console for validation errors
4. Test API endpoint: `POST /api/scenarios` with Postman
5. Check database write permissions

### Runs list is empty

**Symptoms:**
- No runs shown for scenario
- "No completed runs" message

**Solutions:**
1. Verify you've actually run the scenario
2. Check run status in database: may be "running" or "failed"
3. Filter by scenario ID correctly
4. Check database: `SELECT * FROM runs WHERE scenario_id = '...'`

### Compare view shows no data

**Symptoms:**
- Can't select runs to compare
- Empty dropdown lists

**Solutions:**
1. Ensure at least 2 completed runs exist for scenario
2. Check run status is "completed" not "running"
3. Verify scenario has runs: check database
4. Try refreshing page

---

## Browser-Specific Issues

### EventSource not supported

**Symptoms:**
- "EventSource is not defined" error
- Live view doesn't work

**Solutions:**
1. Use modern browser: Chrome, Edge, Firefox, Safari
2. Update browser to latest version
3. Check that JavaScript is enabled
4. Try different browser

### CORS errors

**Symptoms:**
- "Access-Control-Allow-Origin" errors
- Failed to fetch API

**Solutions:**
1. Verify server CORS middleware is enabled
2. Check client is connecting to correct server URL
3. Use Vite proxy (configured in `vite.config.js`)
4. Don't access client via file:// protocol

---

## Development Issues

### Hot reload not working

**Symptoms:**
- Changes to code don't reflect
- Must manually refresh

**Solutions:**
1. Check Vite dev server is running
2. Restart dev server: Ctrl+C, then `npm run dev`
3. Check file is saved (Ctrl+S)
4. Try hard refresh: Ctrl+Shift+R
5. For server: ensure `--watch` flag is enabled

### TypeScript errors (if added later)

**Symptoms:**
- Build fails with type errors
- IDE shows red squiggles

**Solutions:**
1. This project uses plain JavaScript
2. If adding TypeScript, add proper type definitions
3. Install @types packages: `@types/react`, `@types/node`
4. Configure `tsconfig.json` properly

---

## Getting Help

If none of these solutions work:

1. **Check the logs:**
   - Server console output
   - Browser console (F12)
   - Network tab in dev tools

2. **Verify environment:**
   - Node.js version: `node --version` (should be v16+)
   - NPM version: `npm --version`
   - OS: Windows 10/11

3. **Minimal reproduction:**
   - Fresh install: delete all `node_modules` and reinstall
   - Use preset scenarios (known good configs)
   - Test in incognito/private browsing mode

4. **Database reset:**
   ```bash
   # Stop server
   # Delete server/reliability.db
   # Restart server
   cd server && npm run seed
   ```

5. **Nuclear option:**
   ```bash
   # Delete everything and start fresh
   rm -rf node_modules server/node_modules client/node_modules
   rm -rf server/reliability.db
   npm install
   cd server && npm install
   cd ../client && npm install
   cd ..
   npm run dev
   ```

---

## Common Gotchas

1. **Forgetting to start server:** Client needs server running!
2. **Wrong ports:** Server=3001, Client=3000
3. **Not using presets:** Test with presets before custom scenarios
4. **Editing running simulation:** Can't change scenario while it's running
5. **Seed confusion:** Different seeds = different results
6. **Database locks:** Only one server instance at a time
7. **Cache issues:** Hard refresh browser (Ctrl+Shift+R)
8. **Path problems:** Always run scripts from project root
