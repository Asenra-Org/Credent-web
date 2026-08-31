import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/shell/AppShell';
import EngineView from './components/EngineView';
import ManagerDashboard from './components/ManagerDashboard';
import AdminPanel from './pages/AdminPanel';
import ProfileSettings from './pages/ProfileSettings';
import CasesPage, { UnderwritingQueuePage } from './pages/CasesPage';
import CaseWorkspace from './pages/CaseWorkspace';
import AuditLogPage from './pages/AuditLogPage';
import OrgOverview from './pages/OrgOverview';
import PlatformOverview from './pages/platform/PlatformOverview';
import PlatformOrganizations from './pages/platform/PlatformOrganizations';
import OrganizationDetail from './pages/platform/OrganizationDetail';
import PlatformUsers from './pages/platform/PlatformUsers';
import PlatformCases from './pages/platform/PlatformCases';
import SystemHealth from './pages/platform/SystemHealth';
import AiOperations from './pages/platform/AiOperations';
import UsageCost from './pages/platform/UsageCost';
import PlatformConfiguration from './pages/platform/PlatformConfiguration';
import { useAuthStore } from './stores/authStore';
import { homeRouteFor } from './components/shell/navigation';

const RoleRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeRouteFor(user.role)} replace />;
};

// Roles permitted to open a case. Mirrors CASE_READERS on the API; the server
// enforces it regardless of what the client renders.
const CASE_READERS = ['CREDIT_ANALYST', 'UNDERWRITING_MANAGER', 'ORG_ADMIN', 'VIEWER'];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Everything below renders inside the application shell. */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/settings" element={<ProfileSettings />} />

            {/* Case list and workspace, shared across every case-reading role. */}
            <Route element={<ProtectedRoute requiredRoles={CASE_READERS} />}>
              <Route path="/cases" element={<CasesPage />} />
              <Route path="/cases/:caseId" element={<CaseWorkspace />} />
            </Route>

            {/* Platform operations console. Every route is additionally
                enforced by require_role(["SUPER_ADMIN"]) on the API. */}
            <Route element={<ProtectedRoute requiredRoles={['SUPER_ADMIN']} />}>
              <Route path="/platform" element={<PlatformOverview />} />
              <Route path="/platform/organizations" element={<PlatformOrganizations />} />
              <Route path="/platform/organizations/:orgId" element={<OrganizationDetail />} />
              <Route path="/platform/users" element={<PlatformUsers />} />
              <Route path="/platform/cases" element={<PlatformCases />} />
              <Route path="/platform/health" element={<SystemHealth />} />
              <Route path="/platform/ai" element={<AiOperations />} />
              <Route path="/platform/usage" element={<UsageCost />} />
              <Route path="/platform/audit" element={<AuditLogPage />} />
              <Route path="/platform/configuration" element={<PlatformConfiguration />} />
            </Route>

            <Route element={<ProtectedRoute requiredRoles={['ORG_ADMIN']} />}>
              <Route path="/admin" element={<OrgOverview />} />
              <Route path="/admin/cases" element={<CasesPage />} />
              <Route path="/admin/users" element={<AdminPanel />} />
              <Route path="/admin/audit" element={<AuditLogPage />} />
            </Route>

            <Route element={<ProtectedRoute requiredRoles={['UNDERWRITING_MANAGER']} />}>
              <Route path="/dashboard" element={<UnderwritingQueuePage />} />
              <Route path="/review" element={<ManagerDashboard />} />
            </Route>

            <Route element={<ProtectedRoute requiredRoles={['CREDIT_ANALYST']} />}>
              <Route path="/engine" element={<EngineView />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
