/**
 * ============================================================
 *  CRESEM — Platform users (SUPER_ADMIN)
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Backed by GET /platform/users.
 *
 *  The API's select list deliberately excludes password_hash and
 *  mfa_secret. MFA is shown as a posture badge — enabled or not — which is
 *  what an operator needs; the secret behind it never leaves the database.
 */

import React, { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import {
  Badge,
  Button,
  Notice,
  PageHeader,
  Panel,
  SearchInput,
  Select,
  Value,
} from '../../components/ui/primitives';
import { useApi } from '../../hooks/useApi';
import api from '../../lib/api';
import { describeError } from '../../lib/apiError';
import { notify } from '../../stores/notificationStore';
import { formatDateTime, formatRelative, shortId } from '../../lib/format';

const PAGE_SIZE = 50;

// Closed set. Arbitrary role strings must never reach the membership table,
// and the API rejects anything outside this list with a 400.
const ROLE_OPTIONS = [
  { value: 'ORG_ADMIN', label: 'Organization Admin' },
  { value: 'UNDERWRITING_MANAGER', label: 'Underwriting Manager' },
  { value: 'CREDIT_ANALYST', label: 'Credit Analyst' },
  { value: 'VIEWER', label: 'Viewer' },
];

export default function PlatformUsers() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [busyId, setBusyId] = useState(null);

  const { data: orgData } = useApi('/platform/organizations', {
    params: { limit: 200 },
    deps: [],
  });
  const [organizationId, setOrganizationId] = useState('');

  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset,
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
      ...(organizationId ? { organization_id: organizationId } : {}),
      ...(statusFilter ? { is_active: statusFilter === 'active' } : {}),
    }),
    [offset, search, role, organizationId, statusFilter]
  );

  const { data, error, loading, refetch } = useApi('/platform/users', {
    params,
    deps: [offset, search, role, organizationId, statusFilter],
  });

  async function toggleActive(user) {
    setBusyId(user.user_id);
    try {
      await api.patch(`/platform/users/${user.user_id}/status`, { is_active: !user.is_active });
      notify.success(user.is_active ? 'User deactivated' : 'User activated', user.email);
      refetch();
    } catch (err) {
      notify.fromError(describeError(err));
    } finally {
      setBusyId(null);
    }
  }

  const orgOptions = (orgData?.items || []).map((o) => ({ value: o.id, label: o.name }));

  const columns = [
    {
      key: 'email',
      header: 'User',
      sortable: false,
      render: (r) => <span style={{ fontWeight: 'var(--fw-medium)' }}>{r.email}</span>,
    },
    {
      key: 'organization_name',
      header: 'Organization',
      sortable: false,
      render: (r) => <Value value={r.organization_name} absent="No organization" />,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: false,
      render: (r) => <Value value={r.role} absent="No membership" />,
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: false,
      render: (r) => (
        <div className="cx-row">
          <Badge tone={r.is_active ? 'positive' : 'neutral'}>
            {r.is_active ? 'Active' : 'Disabled'}
          </Badge>
          {r.is_locked ? <Badge tone="critical">Locked</Badge> : null}
        </div>
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
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (r) => (
        <Button
          size="sm"
          onClick={() => toggleActive(r)}
          disabled={busyId === r.user_id}
        >
          {busyId === r.user_id ? '…' : r.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Every account across the platform, with its organization and role."
        actions={
          <Button onClick={refetch} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="cx-stack">
        <Notice tone="neutral" title="No credential material is exposed">
          This console never returns password hashes, MFA secrets, session tokens or recovery
          codes. MFA is reported as a posture indicator only.
        </Notice>

        <Panel flush>
          <DataTable
            columns={columns}
            rows={data?.items || []}
            rowKey={(r) => `${r.user_id}-${r.organization_id || 'none'}`}
            loading={loading}
            error={error}
            onRetry={refetch}
            caption="Platform users"
            emptyTitle="No users"
            emptyMessage={
              search || role || organizationId || statusFilter
                ? 'No users match the current filters.'
                : 'Users appear here once organizations have been provisioned.'
            }
            total={data?.total}
            limit={PAGE_SIZE}
            offset={offset}
            onPageChange={setOffset}
            toolbar={
              <>
                <div style={{ minWidth: 220, flex: '1 1 220px' }}>
                  <SearchInput
                    value={search}
                    onChange={(v) => {
                      setSearch(v);
                      setOffset(0);
                    }}
                    placeholder="Search email"
                    label="Search users"
                  />
                </div>
                <div className="cx-table-toolbar__filters">
                  <Select
                    label="Organization"
                    value={organizationId}
                    onChange={(v) => {
                      setOrganizationId(v);
                      setOffset(0);
                    }}
                    options={orgOptions}
                    includeAll
                    allLabel="All organizations"
                  />
                  <Select
                    label="Role"
                    value={role}
                    onChange={(v) => {
                      setRole(v);
                      setOffset(0);
                    }}
                    options={ROLE_OPTIONS}
                    includeAll
                    allLabel="All roles"
                  />
                  <Select
                    label="Status"
                    value={statusFilter}
                    onChange={(v) => {
                      setStatusFilter(v);
                      setOffset(0);
                    }}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'disabled', label: 'Disabled' },
                    ]}
                    includeAll
                    allLabel="All"
                  />
                  <span className="cx-muted cx-mono">
                    {loading ? '…' : `${data?.total ?? 0} user${data?.total === 1 ? '' : 's'}`}
                  </span>
                </div>
              </>
            }
          />
        </Panel>
      </div>
    </>
  );
}

export { Users };
