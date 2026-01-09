import express from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';

const router = express.Router();

// Get all scenarios
router.get('/', (req, res) => {
  const scenarios = db.prepare('SELECT * FROM scenarios ORDER BY updated_at DESC').all();
  res.json(scenarios.map(s => ({
    ...s,
    config: JSON.parse(s.config)
  })));
});

// Get single scenario
router.get('/:id', (req, res) => {
  const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(req.params.id);
  if (!scenario) {
    return res.status(404).json({ error: 'Scenario not found' });
  }
  res.json({
    ...scenario,
    config: JSON.parse(scenario.config)
  });
});

// Create scenario
router.post('/', (req, res) => {
  const { name, config } = req.body;
  const id = nanoid(10);
  const now = Date.now();

  db.prepare(`
    INSERT INTO scenarios (id, name, config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, JSON.stringify(config), now, now);

  res.json({ id, name, config, created_at: now, updated_at: now });
});

// Update scenario
router.put('/:id', (req, res) => {
  const { name, config } = req.body;
  const now = Date.now();

  db.prepare(`
    UPDATE scenarios 
    SET name = ?, config = ?, updated_at = ?
    WHERE id = ?
  `).run(name, JSON.stringify(config), now, req.params.id);

  res.json({ success: true });
});

// Delete scenario
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM scenarios WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Duplicate scenario
router.post('/:id/duplicate', (req, res) => {
  const original = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(req.params.id);
  if (!original) {
    return res.status(404).json({ error: 'Scenario not found' });
  }

  const id = nanoid(10);
  const now = Date.now();
  const name = `${original.name} (copy)`;

  db.prepare(`
    INSERT INTO scenarios (id, name, config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, original.config, now, now);

  res.json({ id, name, config: JSON.parse(original.config), created_at: now, updated_at: now });
});

export default router;
