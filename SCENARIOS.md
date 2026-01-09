# Example Scenarios & Expected Outcomes

This document explains what each preset scenario demonstrates and what you should observe when running them.

## Healthy System

**Purpose:** Baseline for normal operations

**Configuration:**
- RPS: 30
- Capacity: 20 req/tick
- Base Failure: 2%
- Retries: 1 (exponential backoff)
- Circuit Breaker: Enabled (40% threshold)

**Expected Outcome:**
- System stays in STABLE state most of the time
- Error rate hovers around 2-5%
- p95 latency around 50-80ms
- Circuit breaker rarely opens
- Minimal downtime (< 1s)

**Key Insight:** With proper capacity headroom and conservative retry policy, even a small base failure rate doesn't cascade.

---

## Retry Storm

**Purpose:** Demonstrate how excessive retries create cascading failures

**Configuration:**
- RPS: 50
- Capacity: 12 req/tick (UNDER-PROVISIONED)
- Base Failure: 15%
- Retries: 4 (linear backoff, only 50ms)
- Circuit Breaker: DISABLED

**Expected Outcome:**
- Event log shows "Retry storm detected"
- Original 50 RPS becomes 100+ RPS due to retries
- Error rate climbs to 40-60%
- State transitions: STABLE → DEGRADED → DOWN
- Extended downtime (10-15s)
- p95 latency spikes to 300-500ms

**Key Insight:** Without circuit breaker protection, aggressive retries on an already-failing system amplify the load and cause total collapse.

---

## Circuit Breaker Saves You

**Purpose:** Show how circuit breaker prevents cascading failures

**Configuration:**
- RPS: 60
- Capacity: 15 req/tick (UNDER-PROVISIONED)
- Base Failure: 18%
- Retries: 3 (exponential backoff)
- Circuit Breaker: Enabled (30% threshold, aggressive)

**Expected Outcome:**
- Circuit opens quickly when errors hit 30%
- Fast-fail behavior limits queue buildup
- System recovers during cooldown period
- Half-open test traffic succeeds
- Circuit closes and system returns to DEGRADED or STABLE
- Multiple open/close cycles possible

**Key Insight:** Circuit breaker "fails fast" to give system time to recover, preventing prolonged downtime.

---

## Capacity Saturation

**Purpose:** Model pure throughput overload

**Configuration:**
- RPS: 100
- Capacity: 10 req/tick (SEVERELY UNDER-PROVISIONED)
- Base Failure: 5% (low!)
- Retries: 2 (exponential)
- Circuit Breaker: Enabled (45% threshold)

**Expected Outcome:**
- Queue builds immediately (100 RPS > 10 capacity)
- Latency increases due to queueing delay
- Even with low base failure, saturation causes failures
- State goes DOWN quickly
- Circuit breaker opens due to capacity-induced failures
- Downtime: 15-20s

**Key Insight:** Even a healthy service fails when overwhelmed. Capacity planning matters more than retry policies.

---

## Network Spike

**Purpose:** Model latency-driven degradation

**Configuration:**
- RPS: 45
- Capacity: 18 req/tick (adequate)
- Base Latency: 120ms (HIGH)
- Latency Jitter: 60ms (VERY HIGH)
- Base Failure: 12%
- Retries: 2 (exponential, 150ms backoff)
- Circuit Breaker: Enabled (35% threshold)

**Expected Outcome:**
- High variance in latency (60-180ms range)
- State flickers between STABLE and DEGRADED
- Occasional brief circuit trips
- p95 latency: 200-300ms
- Error rate: 15-20%
- Downtime: 3-5s

**Key Insight:** High latency variance creates instability even with adequate capacity. Timeouts and backoff strategies become critical.

---

## Custom Scenario Ideas

### "Death Spiral"
- High RPS + Low Capacity + Many Retries + No Breaker
- Watch queue explode and system never recover

### "Recovery Test"
- Normal config but manually toggle between states
- Observe how quickly system returns to STABLE

### "Breaker Threshold Tuning"
- Run same scenario with breaker thresholds: 20%, 40%, 60%
- Compare downtime and recovery times

### "Backoff Strategy Comparison"
- Run A: No backoff
- Run B: Linear backoff
- Run C: Exponential backoff
- Compare retry storms and latency

---

## Interpreting Results

### Success Rate vs Error Rate
- Success Rate = (successes / total) × 100
- Error Rate = (failures / total) × 100
- Should sum to ~100% (minor rounding differences)

### p95 Latency
- 95% of requests completed in this time or less
- Better indicator than average (not skewed by outliers)
- Watch for spikes during state transitions

### Downtime
- Seconds spent in DOWN state
- Circuit open time counts as downtime
- Goal: minimize this even under load

### Circuit Trips
- How many times breaker opened
- 0 = never needed (good) OR never enabled
- 1-2 = system recovered gracefully
- 5+ = unstable conditions, may need tuning

### Main Cause
- Auto-generated summary of root cause
- Uses heuristics: retry storms, capacity, base failures
- Read event log for detailed timeline

---

## Running Experiments

### Hypothesis-Driven Testing

**Example 1:**
- **Hypothesis:** Exponential backoff reduces retry storms
- **Test:** Run "Retry Storm" with linear vs exponential backoff
- **Measure:** Compare retry counts and error rates

**Example 2:**
- **Hypothesis:** Circuit breaker reduces downtime
- **Test:** Run same high-failure scenario with/without breaker
- **Measure:** Compare total downtime

**Example 3:**
- **Hypothesis:** Higher capacity headroom improves stability
- **Test:** Run scenarios with capacity = RPS × 0.5, 1.0, 1.5
- **Measure:** Compare state transitions and latency

### Reproducibility

Always note the **seed value** for runs you want to reproduce:
- Same scenario + same seed = identical results
- Different seeds = different random failure patterns
- Useful for debugging and presentations

### Sharing Results

Use "Copy Summary" button to get formatted text:

```
Reliability Simulation Report
Scenario: Retry Storm
Duration: 30s

Results:
- Total Requests: 1247
- Success Rate: 38.5%
- Error Rate: 61.5%
- p95 Latency: 487ms
- Downtime: 14.2s
- Circuit Breaker Trips: 0

Analysis: Retry storm caused cascading failures and increased load
```

Paste into Slack, Jira, or design docs!
