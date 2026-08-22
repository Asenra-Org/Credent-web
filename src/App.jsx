import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import EngineView from './components/EngineView';
import ManagerDashboard from './components/ManagerDashboard';
import AdminPanel from './pages/AdminPanel';
import SuperAdminPanel from './pages/SuperAdminPanel';
import { useAuthStore } from './stores/authStore';

const RoleRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  switch(user.role) {
    case 'SUPER_ADMIN': return <Navigate to="/platform" replace />;
    case 'ORG_ADMIN': return <Navigate to="/admin" replace />;
    case 'UNDERWRITING_MANAGER': return <Navigate to="/dashboard" replace />;
    case 'CREDIT_ANALYST': return <Navigate to="/engine" replace />;
    case 'VIEWER': return <Navigate to="/reports" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<RoleRedirect />} />
        </Route>

        <Route element={<ProtectedRoute requiredRoles={['SUPER_ADMIN']} />}>
          <Route path="/platform" element={<SuperAdminPanel />} />
        </Route>
        
        <Route element={<ProtectedRoute requiredRoles={['ORG_ADMIN']} />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
        
        <Route element={<ProtectedRoute requiredRoles={['UNDERWRITING_MANAGER']} />}>
          <Route path="/dashboard" element={<ManagerDashboard />} />
          <Route path="/portfolio" element={<div className="p-8">Portfolio view coming soon</div>} />
        </Route>
        
        <Route element={<ProtectedRoute requiredRoles={['CREDIT_ANALYST']} />}>
          <Route path="/engine" element={<EngineView />} />
          <Route path="/my-cases" element={<div className="p-8">My Cases view coming soon</div>} />
        </Route>
        
        <Route element={<ProtectedRoute requiredRoles={['VIEWER']} />}>
          <Route path="/reports" element={<div className="p-8">Reports Archive coming soon</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}