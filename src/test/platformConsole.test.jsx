import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppShell from '../components/shell/AppShell';
import { useAuthStore } from '../stores/authStore';
import { navigationFor } from '../components/shell/navigation';
import { MetricTile, NotMeasuredPanel, metricLabel } from '../components/ui/NotMeasured';
import api from '../lib/api';

vi.mock('../lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

import PlatformOverview from '../pages/platform/PlatformOverview';
import PlatformUsers from '../pages/platform/PlatformUsers';
import PlatformCases from '../pages/platform/PlatformCases';
import SystemHealth from '../pages/platform/SystemHealth';
import PlatformConfiguration from '../pages/platform/PlatformConfiguration';
import PlatformOrganizations from '../pages/platform/PlatformOrganizations';

function renderPage(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

/** Route GET calls by path so a page's several requests each get their own body. */
function mockGet(routes) {
  api.get.mockImplementation((path) => {
    for (const [prefix, body] of Object.entries(routes)) {
      if (path.startsWith(prefix)) return Promise.resolve({ data: body });
    }
    return Promise.resolve({ data: {} });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe('super admin navigation', () => {
  it('exposes all nine specified console sections', () => {
    const labels = navigationFor('SUPER_ADMIN').flatMap((s) => s.items.map((i) => i.label));
    expect(labels).toEqual([
      'Overview',
      'Organizations',
      'Users',
      'Cases',
      'System Health',
      'AI / Model Ops',
      'Usage & Cost',
      'Audit & Security',
      'Configuration',
    ]);
  });

  it('marks every console section as built', () => {
    const items = navigationFor('SUPER_ADMIN').flatMap((s) => s.items);
    expect(items.every((i) => i.available)).toBe(true);
  });

  it('renders the console nav inside the shared shell, not a second one', () => {
    useAuthStore.setState({
      user: { user_id: 'u1', email: 'op@cresem.io', role: 'SUPER_ADMIN', organization: { id: 'o', name: 'CRESEM' } },
      isAuthenticated: true,
    });
    render(
      <MemoryRouter initialEntries={['/platform']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/platform" element={<div>console</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getAllByRole('navigation', { name: 'Primary' })).toHaveLength(1);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByText('Organizations')).toBeInTheDocument();
    // A platform operator has no tenant case queue.
    expect(within(nav).queryByText('Queue')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Not-measured handling
// ---------------------------------------------------------------------------

describe('unmeasured metrics are never fabricated', () => {
  it('renders NOT MEASURED instead of a zero', () => {
    render(
      <MetricTile
        metric={{ metric: 'ai_cost', value: null, measured: false, requires: 'Token accounting' }}
      />
    );
    expect(screen.getByText('NOT MEASURED')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('states what telemetry the metric needs', () => {
    render(
      <MetricTile
        metric={{ metric: 'ai_cost', value: null, measured: false, requires: 'Token accounting' }}
      />
    );
    expect(screen.getByText('Token accounting')).toBeInTheDocument();
  });

  it('renders a genuine measured zero as zero', () => {
    render(<MetricTile metric={{ metric: 'failed_cases', value: 0, measured: true }} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('NOT MEASURED')).not.toBeInTheDocument();
  });

  it('humanises metric keys for display', () => {
    expect(metricLabel('platform_ai_calls')).toBe('Platform AI Calls');
    expect(metricLabel('total_cases')).toBe('Total Cases');
  });

  it('lists unmeasured metrics with their requirement in a panel', () => {
    render(
      <NotMeasuredPanel
        title="Model telemetry"
        metrics={[
          { metric: 'requests', value: null, measured: false, requires: 'Per-call LLM telemetry' },
          { metric: 'average_latency', value: null, measured: false, requires: 'Duration recording' },
        ]}
      />
    );
    expect(screen.getByText('Requests')).toBeInTheDocument();
    expect(screen.getByText('Per-call LLM telemetry')).toBeInTheDocument();
    expect(screen.getAllByText('Not measured').length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

describe('platform overview', () => {
  const overview = {
    metrics: [
      { metric: 'total_organizations', value: 4, measured: true },
      { metric: 'total_cases', value: 12, measured: true },
      { metric: 'failed_cases', value: 2, measured: true },
      { metric: 'ai_cost', value: null, measured: false, requires: 'Token accounting and pricing' },
      { metric: 'platform_ai_calls', value: null, measured: false, requires: 'Per-call telemetry' },
      { metric: 'average_processing_time', value: null, measured: false, requires: 'Pipeline timestamps' },
      { metric: 'system_error_rate', value: null, measured: false, requires: 'Outcome counters' },
    ],
  };

  it('renders measured counts from the API', async () => {
    mockGet({
      '/platform/overview': overview,
      '/platform/case-trend': { items: [] },
      '/platform/status-distribution': { items: [] },
    });
    renderPage(<PlatformOverview />);
    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows unmeasured platform metrics as NOT MEASURED', async () => {
    mockGet({
      '/platform/overview': overview,
      '/platform/case-trend': { items: [] },
      '/platform/status-distribution': { items: [] },
    });
    renderPage(<PlatformOverview />);
    await waitFor(() => expect(screen.getAllByText('NOT MEASURED').length).toBe(4));
  });

  it('shows a chart empty state rather than an empty axis', async () => {
    mockGet({
      '/platform/overview': overview,
      '/platform/case-trend': { items: [] },
      '/platform/status-distribution': { items: [] },
    });
    renderPage(<PlatformOverview />);
    expect(await screen.findByText('No cases recorded')).toBeInTheDocument();
    expect(screen.getByText('No appraisals recorded')).toBeInTheDocument();
  });

  it('renders a loading state before data arrives', () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    renderPage(<PlatformOverview />);
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('renders a 403 without offering a retry', async () => {
    api.get.mockRejectedValue({ response: { status: 403, data: {}, headers: {} } });
    renderPage(<PlatformOverview />);
    expect(await screen.findByText('Not permitted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('renders a 401 as a session problem', async () => {
    api.get.mockRejectedValue({ response: { status: 401, data: {}, headers: {} } });
    renderPage(<PlatformOverview />);
    expect(await screen.findByText('Session expired')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

describe('organizations', () => {
  const orgs = {
    items: [
      {
        id: 'org-1',
        name: 'Meridian Bank',
        is_active: true,
        created_at: '2026-01-05T10:00:00Z',
        user_count: 6,
        case_count: 14,
        last_activity: '2026-08-24T10:00:00Z',
      },
    ],
    total: 1,
  };

  it('renders organization rows with counts', async () => {
    mockGet({ '/platform/organizations': orgs });
    renderPage(<PlatformOrganizations />);
    expect(await screen.findByText('Meridian Bank')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('marks organization usage as not measured', async () => {
    mockGet({ '/platform/organizations': orgs });
    renderPage(<PlatformOrganizations />);
    expect(await screen.findByText('Not measured')).toBeInTheDocument();
  });

  it('offers create as the empty-state action, never a signup link', async () => {
    mockGet({ '/platform/organizations': { items: [], total: 0 } });
    renderPage(<PlatformOrganizations />);
    expect(await screen.findByText('No organizations')).toBeInTheDocument();
    // The empty state offers operator-driven creation. There must be no signup
    // affordance anywhere - the page copy stating that self-service signup does
    // not exist is expected, so assert on interactive elements rather than text.
    const actions = screen.getAllByRole('button').map((b) => b.textContent.toLowerCase());
    expect(actions.some((a) => a.includes('create organization'))).toBe(true);
    expect(actions.some((a) => a.includes('sign up') || a.includes('signup'))).toBe(false);
    expect(screen.queryByRole('link', { name: /sign ?up/i })).not.toBeInTheDocument();
  });

  it('the creation form issues an invitation and never shows a password', async () => {
    mockGet({ '/platform/organizations': { items: [], total: 0 } });
    api.post.mockResolvedValue({
      data: {
        organization: { id: 'org-9', name: 'New Bank', is_active: true },
        invitation: {
          email: 'admin@new.com',
          role: 'ORG_ADMIN',
          token: 'invite-token-abc',
          expires_at: '2026-09-01 00:00:00',
        },
      },
    });

    renderPage(<PlatformOrganizations />);
    await userEvent.click(await screen.findByRole('button', { name: /create organization/i }));

    await userEvent.type(screen.getByLabelText(/organization name/i), 'New Bank');
    await userEvent.type(screen.getByLabelText(/organization admin email/i), 'admin@new.com');
    await userEvent.click(screen.getByRole('button', { name: /^create organization$/i }));

    expect(await screen.findByText('invite-token-abc')).toBeInTheDocument();
    expect(screen.getByText(/no password has been created or transmitted/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

describe('platform users', () => {
  const users = {
    items: [
      {
        user_id: 'u-1',
        email: 'analyst@bank.com',
        is_active: true,
        is_locked: false,
        created_at: '2026-02-01T10:00:00Z',
        last_login_at: '2026-08-24T09:00:00Z',
        mfa_enabled: true,
        role: 'CREDIT_ANALYST',
        organization_id: 'org-1',
        organization_name: 'Meridian Bank',
      },
      {
        user_id: 'u-2',
        email: 'dormant@bank.com',
        is_active: true,
        is_locked: false,
        created_at: '2026-02-01T10:00:00Z',
        last_login_at: null,
        mfa_enabled: false,
        role: 'VIEWER',
        organization_id: 'org-1',
        organization_name: 'Meridian Bank',
      },
    ],
    total: 2,
  };

  it('renders users with organization and role', async () => {
    mockGet({ '/platform/users': users, '/platform/organizations': { items: [], total: 0 } });
    renderPage(<PlatformUsers />);
    expect(await screen.findByText('analyst@bank.com')).toBeInTheDocument();
    expect(screen.getByText('CREDIT_ANALYST')).toBeInTheDocument();
  });

  it('shows "Never signed in" rather than inventing a date', async () => {
    mockGet({ '/platform/users': users, '/platform/organizations': { items: [], total: 0 } });
    renderPage(<PlatformUsers />);
    expect(await screen.findByText('Never signed in')).toBeInTheDocument();
  });

  it('states that no credential material is exposed', async () => {
    mockGet({ '/platform/users': users, '/platform/organizations': { items: [], total: 0 } });
    renderPage(<PlatformUsers />);
    expect(await screen.findByText(/no credential material is exposed/i)).toBeInTheDocument();
  });

  it('reports MFA as posture only', async () => {
    mockGet({ '/platform/users': users, '/platform/organizations': { items: [], total: 0 } });
    renderPage(<PlatformUsers />);
    expect(await screen.findByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Not enabled')).toBeInTheDocument();
  });

  it('offers only the four assignable roles as filters', async () => {
    mockGet({ '/platform/users': users, '/platform/organizations': { items: [], total: 0 } });
    renderPage(<PlatformUsers />);
    const select = await screen.findByLabelText('Role');
    const values = within(select).getAllByRole('option').map((o) => o.value).filter(Boolean);
    expect(values).toEqual(['ORG_ADMIN', 'UNDERWRITING_MANAGER', 'CREDIT_ANALYST', 'VIEWER']);
  });
});

// ---------------------------------------------------------------------------
// Cases - tenant isolation
// ---------------------------------------------------------------------------

describe('platform case operations', () => {
  const cases = {
    items: [
      {
        case_id: 'case-abc-123',
        organization_id: 'org-1',
        status: 'FAILED',
        current_step: 'coordinator_running',
        analysis_status: 'FAILED',
        decision_allowed: false,
        created_at: '2026-08-20T10:00:00Z',
        updated_at: '2026-08-24T10:00:00Z',
        has_error: true,
      },
    ],
    total: 1,
  };

  it('states that tenant isolation applies', async () => {
    mockGet({ '/platform/cases': cases, '/platform/organizations': { items: [], total: 0 } });
    renderPage(<PlatformCases />);
    expect(await screen.findByText(/tenant isolation applies to this screen/i)).toBeInTheDocument();
  });

  it('renders processing state and the gate outcome', async () => {
    mockGet({ '/platform/cases': cases, '/platform/organizations': { items: [], total: 0 } });
    renderPage(<PlatformCases />);
    expect(await screen.findByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Gated')).toBeInTheDocument();
  });

  it('has no column for borrower, amount or decision', async () => {
    mockGet({ '/platform/cases': cases, '/platform/organizations': { items: [], total: 0 } });
    renderPage(<PlatformCases />);
    await screen.findByText('Failed');
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent.toLowerCase());
    for (const forbidden of ['borrower', 'amount', 'decision', 'facility']) {
      expect(headers.some((h) => h.includes(forbidden))).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Health and configuration
// ---------------------------------------------------------------------------

describe('system health', () => {
  const health = {
    checked_at: '2026-08-25T00:00:00Z',
    recent_pipeline_failures: 1,
    components: [
      { component: 'database', state: 'operational', detail: 'SQLite', response_ms: 1.2 },
      { component: 'llm_provider', state: 'configured', detail: 'openai/gpt-oss-20b', response_ms: null },
    ],
    unmeasured: [
      { metric: 'api_error_rate', value: null, measured: false, requires: 'Outcome counters' },
    ],
  };

  it('renders component state and measured response times', async () => {
    mockGet({ '/platform/health': health });
    renderPage(<SystemHealth />);
    expect(await screen.findByText('Application database')).toBeInTheDocument();
    expect(screen.getByText('1.2 ms')).toBeInTheDocument();
  });

  it('says "Not probed" where no timing was taken', async () => {
    mockGet({ '/platform/health': health });
    renderPage(<SystemHealth />);
    expect(await screen.findByText('Not probed')).toBeInTheDocument();
  });

  it('lists unmeasured operational telemetry', async () => {
    mockGet({ '/platform/health': health });
    renderPage(<SystemHealth />);
    expect(await screen.findByText('Api Error Rate')).toBeInTheDocument();
  });
});

describe('platform configuration', () => {
  const config = {
    editable: false,
    sections: [
      {
        section: 'Rate limits',
        settings: [{ key: 'RATE_LIMIT_AI', value: '20', unit: 'per hour per tenant', sensitive: false }],
      },
      {
        section: 'Secrets',
        settings: [
          { key: 'GROQ_API_KEY', value: 'configured', sensitive: true },
          { key: 'AUTH_DATABASE_URL', value: 'not configured', sensitive: true },
        ],
      },
    ],
  };

  it('renders settings as read-only, with no editable control', async () => {
    mockGet({ '/platform/configuration': config });
    renderPage(<PlatformConfiguration />);
    expect(await screen.findByText('RATE_LIMIT_AI')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
  });

  it('shows secrets as posture only', async () => {
    mockGet({ '/platform/configuration': config });
    renderPage(<PlatformConfiguration />);
    expect(await screen.findByText('Configured')).toBeInTheDocument();
    expect(screen.getByText('Not configured')).toBeInTheDocument();
    expect(screen.getAllByText(/never read by this API/i).length).toBeGreaterThan(0);
  });

  it('explains that values are environment configured', async () => {
    mockGet({ '/platform/configuration': config });
    renderPage(<PlatformConfiguration />);
    expect(await screen.findByText(/environment configured/i)).toBeInTheDocument();
  });
});
