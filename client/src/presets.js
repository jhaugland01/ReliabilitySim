export const PRESET_SCENARIOS = [
  {
    name: 'Healthy System',
    config: {
      rps: 30,
      duration: 30,
      tickInterval: 250,
      baseLatency: 50,
      latencyJitter: 15,
      capacity: 20,
      baseFailureProbability: 0.02,
      retry: {
        maxRetries: 1,
        backoffType: 'exponential',
        backoffDelay: 100
      },
      circuitBreaker: {
        enabled: true,
        errorThreshold: 40,
        windowTicks: 8,
        cooldownTime: 5
      }
    }
  },
  {
    name: 'Retry Storm',
    config: {
      rps: 50,
      duration: 30,
      tickInterval: 250,
      baseLatency: 80,
      latencyJitter: 30,
      capacity: 12,
      baseFailureProbability: 0.15,
      retry: {
        maxRetries: 4,
        backoffType: 'linear',
        backoffDelay: 50
      },
      circuitBreaker: {
        enabled: false,
        errorThreshold: 35,
        windowTicks: 8,
        cooldownTime: 5
      }
    }
  },
  {
    name: 'Circuit Breaker Saves You',
    config: {
      rps: 60,
      duration: 30,
      tickInterval: 250,
      baseLatency: 100,
      latencyJitter: 40,
      capacity: 15,
      baseFailureProbability: 0.18,
      retry: {
        maxRetries: 3,
        backoffType: 'exponential',
        backoffDelay: 100
      },
      circuitBreaker: {
        enabled: true,
        errorThreshold: 30,
        windowTicks: 6,
        cooldownTime: 8
      }
    }
  },
  {
    name: 'Capacity Saturation',
    config: {
      rps: 100,
      duration: 30,
      tickInterval: 250,
      baseLatency: 60,
      latencyJitter: 20,
      capacity: 10,
      baseFailureProbability: 0.05,
      retry: {
        maxRetries: 2,
        backoffType: 'exponential',
        backoffDelay: 100
      },
      circuitBreaker: {
        enabled: true,
        errorThreshold: 45,
        windowTicks: 10,
        cooldownTime: 5
      }
    }
  },
  {
    name: 'Network Spike',
    config: {
      rps: 45,
      duration: 30,
      tickInterval: 250,
      baseLatency: 120,
      latencyJitter: 60,
      capacity: 18,
      baseFailureProbability: 0.12,
      retry: {
        maxRetries: 2,
        backoffType: 'exponential',
        backoffDelay: 150
      },
      circuitBreaker: {
        enabled: true,
        errorThreshold: 35,
        windowTicks: 8,
        cooldownTime: 6
      }
    }
  }
];
