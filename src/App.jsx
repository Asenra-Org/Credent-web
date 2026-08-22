import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import EngineView from './components/EngineView';
import ManagerDashboard from './components/ManagerDashboard';
import LandingPage from './components/LandingPage';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/engine" replace />} />
          <Route path="/engine" element={<EngineView />} />
          <Route path="/dashboard" element={<ManagerDashboard />} />
        </Route>
        <Route element={<ProtectedRoute requiredRoles={['ORG_ADMIN', 'SUPER_ADMIN']} />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}