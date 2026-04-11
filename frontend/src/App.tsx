import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Contracts from './pages/Contracts';
import ContractEditor from './pages/ContractEditor';
import VersionCompare from './pages/VersionCompare';
import ClauseLibrary from './pages/ClauseLibrary';
import AuditHistory from './pages/AuditHistory';
import RiskAlerts from './pages/RiskAlerts';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="draft" element={<ContractEditor />} />
          <Route path="compare" element={<VersionCompare />} />
          <Route path="library" element={<ClauseLibrary />} />
          <Route path="risks" element={<RiskAlerts />} />
          <Route path="audit" element={<AuditHistory />} />
          <Route path="*" element={<div className="p-8">Page not found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
