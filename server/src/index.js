import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import scenarioRoutes from './routes/scenarios.js';
import runRoutes from './routes/runs.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

initDB();

app.use('/api/scenarios', scenarioRoutes);
app.use('/api/runs', runRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
