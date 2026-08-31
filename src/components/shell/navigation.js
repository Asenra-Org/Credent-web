/**
 * Role-aware navigation.
 *
 * The navigation is generated from the authenticated role, but it is *not* the
 * security boundary. Every route is additionally gated by ProtectedRoute on the
 * client and by require_role() on the API. Hiding a link is a usability
 * decision; refusing the request is the control.
 *
 * Entries marked `available: false` are specified screens that are not built
 * yet. They are rendered as disabled with a "Not built yet" hint rather than
 * being silently omitted, so the shell never pretends the product is smaller
 * than it is, and never routes to a blank page.
 */

import {
  Activity,
  Building2,
  ClipboardCheck,
  FileText,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Scale,
  Server,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';

export const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Organization Admin',
  UNDERWRITING_MANAGER: 'Underwriting Manager',
  CREDIT_ANALYST: 'Credit Analyst',
  VIEWER: 'Viewer',
};

const NAV = {
  SUPER_ADMIN: [
    {
      label: 'Platform',
      items: [
        { to: '/platform', label: 'Overview', icon: LayoutDashboard, available: true },
        { to: '/platform/organizations', label: 'Organizations', icon: Building2, available: true },
        { to: '/platform/users', label: 'Users', icon: Users, available: true },
        { to: '/platform/cases', label: 'Cases', icon: FolderOpen, available: true },
        { to: '/platform/health', label: 'System Health', icon: Server, available: true },
        { to: '/platform/ai', label: 'AI / Model Ops', icon: Activity, available: true },
        { to: '/platform/usage', label: 'Usage & Cost', icon: Gauge, available: true },
        { to: '/platform/audit', label: 'Audit & Security', icon: ShieldCheck, available: true },
        { to: '/platform/configuration', label: 'Configuration', icon: Settings2, available: true },
      ],
    },
  ],

  ORG_ADMIN: [
    {
      label: 'Organization',
      items: [
        { to: '/admin', label: 'Overview', icon: LayoutDashboard, available: true },
        { to: '/admin/cases', label: 'Cases', icon: FolderOpen, available: true },
        { to: '/admin/users', label: 'Users', icon: Users, available: true },
        { to: '/admin/analytics', label: 'Analytics', icon: Activity, available: false },
        { to: '/admin/audit', label: 'Audit Log', icon: ShieldCheck, available: true },
        { to: '/admin/settings', label: 'Settings', icon: Scale, available: false },
      ],
    },
  ],

  UNDERWRITING_MANAGER: [
    {
      label: 'Underwriting',
      items: [
        { to: '/dashboard', label: 'Queue', icon: ClipboardCheck, available: true },
        { to: '/cases', label: 'All Cases', icon: FolderOpen, available: true },
        { to: '/decisions', label: 'Decisions', icon: Scale, available: false },
        { to: '/portfolio', label: 'Portfolio Insights', icon: Activity, available: false },
      ],
    },
  ],

  CREDIT_ANALYST: [
    {
      label: 'My work',
      items: [
        { to: '/engine', label: 'New Analysis', icon: FileText, available: true },
        { to: '/cases', label: 'Cases', icon: FolderOpen, available: true },
        { to: '/tasks', label: 'Tasks', icon: ListChecks, available: false },
      ],
    },
  ],

  VIEWER: [
    {
      label: 'Reports',
      items: [{ to: '/cases', label: 'Cases', icon: FolderOpen, available: true }],
    },
  ],
};

export function navigationFor(role) {
  return NAV[role] || [];
}

/** The landing route for a role after sign-in. */
export function homeRouteFor(role) {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/platform';
    case 'ORG_ADMIN':
      return '/admin';
    case 'UNDERWRITING_MANAGER':
      return '/dashboard';
    case 'CREDIT_ANALYST':
      return '/engine';
    case 'VIEWER':
      return '/cases';
    default:
      return '/login';
  }
}
