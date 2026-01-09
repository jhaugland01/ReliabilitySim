import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ScenarioLibrary from './pages/ScenarioLibrary';
import ScenarioBuilder from './pages/ScenarioBuilder';
import RunLive from './pages/RunLive';
import RunReport from './pages/RunReport';
import CompareRuns from './pages/CompareRuns';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ScenarioLibrary />} />
        <Route path="scenario/new" element={<ScenarioBuilder />} />
        <Route path="scenario/:id/edit" element={<ScenarioBuilder />} />
        <Route path="run/:id/live" element={<RunLive />} />
        <Route path="run/:id/report" element={<RunReport />} />
        <Route path="compare" element={<CompareRuns />} />
      </Route>
    </Routes>
  );
}

export default App;
