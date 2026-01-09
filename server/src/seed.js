import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../reliability.db'));

const PRESET_SCENARIOS = [
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
  }
];

console.log('Seeding database with preset scenarios...');

const now = Date.now();

for (const preset of PRESET_SCENARIOS) {
  const id = nanoid(10);
  db.prepare(`
    INSERT INTO scenarios (id, name, config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, preset.name, JSON.stringify(preset.config), now, now);
  
  console.log(`✓ Created: ${preset.name}`);
}

console.log('Seeding complete!');
db.close();
