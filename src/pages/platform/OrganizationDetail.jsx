/**
 * ============================================================
 *  CRESEM — Organization detail (SUPER_ADMIN)
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Backed by GET /platform/organizations/{id}.
 *
 *  The Cases tab shows counts by processing state, not case contents.
 *  A platform operator runs the platform; reading a customer's credit files
 *  is a different job, and the API does not return that data here.
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Fact,
  FactList,
  LoadingState,
  Notice,
  PageHeader,
  Panel,
  TabPanel,
  Tabs,
  Value,
} from '../../components/ui/primitives';
import DataTable from '../../components/ui/DataTable';
import AuditLogPage from '../AuditLogPage';
import { useApi } from '../../hooks/useApi';
import api from '../../lib/api';
import { describeError } from '../../lib/apiError';
import { notify } from '../../stores/notificationStore';
import { formatDateTime, formatRelative, shortId } from '../../lib/format';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'cases', label: 'Cases' },
  { id: 'usage', label: 'Usage' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'audit', label: 'Audit log' },
];

export default function OrganizationDetail() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [busy, setBusy] = useState(false);

  const { data, error, loading, refetch } = useApi(`/platform/organizations/${orgId}`, {
    deps: [orgId],
  });

  const org = data?.organization;
  const users = data?.users || [];
  const caseStatusCounts = data?.case_status_counts || [];

  async function toggleActive() {
    setBusy(true);
    try {
      await api.patch(`/platform/organizations/${orgId}`, { is_active: !org.is_active });
      notify.success(org.is_active ? 'Organization disabled' : 'Organization enabled', org.name);
      refetch();
    } catch (err) {
      notify.fromError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) return <LoadingState label="Loading organization" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!org) {
    return (
      <EmptyState
        title="Organization not found"
        message="This organization does not exist."
        action={<Button onClick={() => navigate('/platform/organizations')}>Back to organizations</Button>}
      />
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          {
            label: 'Organizations',
            to: '/platform/organizations',
            onClick: (e) => {
              e.preventDefault();
              navigate('/platform/organizations');
            },
          },
          { label: org.name },
        ]}
        title={org.name}
        description={`Identifier ${org.id}`}
        actions={
          <>
            <Badge tone={org.is_active ? 'positive' : 'neutral'}>
              {org.is_active ? 'Active' : 'Disabled'}
            </Badge>
            <Button onClick={toggleActive} disabled={busy}>
              {busy ? '…' : org.is_active ? 'Disable' : 'Enable'}
            </Button>
            <Button onClick={refetch} disabled={loading}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="cx-stack">
        <Tabs tabs={TABS} active={tab} onChange={setTab} label="Organization sections" />

        <TabPanel id="overview" active={tab}>
          <Panel title="Profile">
            <FactList>
              <Fact label="Name" value={org.name} />
              <Fact label="Identifier" value={org.id} mono />
              <Fact label="Status" value={org.is_active ? 'Active' : 'Disabled'} />
              <Fact label="Created" value={formatDateTime(org.created_at)} />
              <Fact label="Users" value={org.user_count} />
              <Fact label="Cases" value={org.case_count} />
              <Fact
                label="Last activity"
                value={formatRelative(org.last_activity)}
                absent="No activity recorded"
              />
            </FactList>
          </Panel>
        </TabPanel>

        <TabPanel id="users" active={tab}>
          <Panel title="Members" flush>
            <DataTable
              columns={[
                { key: 'email', header: 'User', sortable: false },
                { key: 'role', header: 'Role', sortable: false, render: (r) => <Value value={r.role} absent="No membership" /> },
                {
                  key: 'is_active',
                  header: 'Status',
                  sortable: false,
                  render: (r) => (
                    <Badge tone={r.is_active ? 'positive' : 'neutral'}>
                      {r.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  ),
                },
                {
                  key: 'mfa_enabled',
                  header: 'MFA',
                  sortable: false,
                  render: (r) => (
                    <Badge tone={r.mfa_enabled ? 'positive' : 'warning'}>
                      {r.mfa_enabled ? 'Enabled' : 'Not enabled'}
                    </Badge>
                  ),
                },
                {
                  key: 'last_login_at',
                  header: 'Last login',
                  sortable: false,
                  render: (r) => (
                    <span title={r.last_login_at || undefined}>
                      <Value value={formatRelative(r.last_login_at)} absent="Never signed in" />
                    </span>
                  ),
                },
                {
                  key: 'created_at',
                  header: 'Created',
                  sortable: false,
                  render: (r) => <Value value={formatDateTime(r.created_at)} />,
                },
              ]}
              rows={users}
              rowKey={(r) => r.user_id}
              caption="Organization members"
              emptyTitle="No users"
              emptyMessage="No accounts have been provisioned for this organization yet."
            />
          </Panel>
        </TabPanel>

        <TabPanel id="cases" active={tab}>
          <div className="cx-stack">
            <Notice tone="neutral" title="Operational counts only">
              A platform operator sees how many cases exist and what state they are in. Borrower
              identity, financial figures, CAM contents and documents remain inside the
              organization and are not returned by this endpoint.
            </Notice>
            <Panel title="Cases by processing state" flush>
              <DataTable
                columns={[
                  { key: 'status', header: 'Processing state', sortable: false },
                  {
                    key: 'count',
                    header: 'Cases',
                    numeric: true,
                    sortable: false,
                    render: (r) => <span className="cx-mono">{r.count}</span>,
                  },
                ]}
                rows={caseStatusCounts}
                rowKey={(r) => r.status}
                caption="Cases by processing state"
                emptyTitle="No cases"
                emptyMessage="This organization has not created any cases yet."
              />
            </Panel>
          </div>
        </TabPanel>

        <TabPanel id="usage" active={tab}>
          <Panel title="Usage">
            <Notice tone="neutral" title="Not measured">
              <p style={{ margin: 0 }}>
                {data?.usage?.requires ||
                  'Per-call LLM telemetry keyed by tenant is not captured.'}
              </p>
              <p style={{ margin: 'var(--sp-2) 0 0' }} className="cx-muted">
                Processing volume is available on the platform Usage page; per-organization AI
                consumption and cost require telemetry that does not exist yet.
              </p>
            </Notice>
          </Panel>
        </TabPanel>

        <TabPanel id="configuration" active={tab}>
          <Panel title="Configuration">
            <Notice tone="neutral" title="Credit policy is organization-owned">
              Underwriting thresholds for this organization are managed through the institution
              policy API by an Organization Admin, not by a platform operator. Platform-level
              configuration is on the Platform Configuration page.
            </Notice>
          </Panel>
        </TabPanel>

        <TabPanel id="audit" active={tab}>
          {/* The audit explorer accepts an explicit organization scope, which a
              SUPER_ADMIN is permitted to set. */}
          <AuditLogPage organizationId={orgId} />
        </TabPanel>
      </div>
    </>
  );
}

export { shortId };
