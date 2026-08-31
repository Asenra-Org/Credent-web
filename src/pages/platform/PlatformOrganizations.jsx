/**
 * ============================================================
 *  CRESEM — Organizations (SUPER_ADMIN)
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Organization lifecycle: list, search, filter, create, enable, disable.
 *
 *  Organizations are provisioned by a platform operator. There is no
 *  self-service signup and nothing here creates one.
 *
 *  Provisioning the first ORG_ADMIN issues a single-use invitation token
 *  through the existing invitations table. No password is generated,
 *  displayed or transmitted — the invitee sets their own credential.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import {
  Badge,
  Button,
  Field,
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

const PAGE_SIZE = 25;

function CreateOrganizationForm({ onCreated, onCancel }) {
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/platform/organizations', {
        name: name.trim(),
        ...(adminEmail.trim() ? { admin_email: adminEmail.trim() } : {}),
      });
      notify.success('Organization created', res.data.organization.name);
      if (res.data.invitation) {
        setInvitation(res.data.invitation);
      } else {
        onCreated();
      }
    } catch (err) {
      const described = describeError(err);
      setError(described);
      notify.fromError(described);
    } finally {
      setSubmitting(false);
    }
  }

  if (invitation) {
    return (
      <Panel title="Organization created">
        <Notice tone="warning" title="Deliver this invitation link out of band">
          <p style={{ margin: 0 }}>
            This token is shown once and is not recoverable — only its hash is stored. It lets{' '}
            <strong>{invitation.email}</strong> claim the Organization Admin account and set their
            own credential. No password has been created or transmitted.
          </p>
          <p style={{ margin: 'var(--sp-3) 0 0' }} className="cx-mono">
            {invitation.token}
          </p>
          <p style={{ margin: 'var(--sp-2) 0 0' }} className="cx-muted">
            Expires {formatDateTime(invitation.expires_at) || invitation.expires_at}
          </p>
        </Notice>
        <div className="cx-row" style={{ marginTop: 'var(--sp-4)' }}>
          <Button variant="primary" onClick={onCreated}>
            Done
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Create organization" subtitle="Organizations are provisioned by the platform operator.">
      <form onSubmit={submit} className="cx-stack" style={{ maxWidth: 520 }}>
        <Field label="Organization name" help="The institution's legal or trading name.">
          {(id) => (
            <input
              id={id}
              className="cx-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={200}
              autoComplete="organization"
            />
          )}
        </Field>

        <Field
          label="Organization admin email (optional)"
          help="If supplied, an ORG_ADMIN account is provisioned and a single-use invitation token is issued. No password is created."
        >
          {(id) => (
            <input
              id={id}
              type="email"
              className="cx-input"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              autoComplete="email"
            />
          )}
        </Field>

        {error ? (
          <Notice tone="critical" title={error.title}>
            {error.message}
          </Notice>
        ) : null}

        <div className="cx-row">
          <Button type="submit" variant="primary" disabled={submitting || name.trim().length < 2}>
            {submitting ? 'Creating…' : 'Create organization'}
          </Button>
          <Button onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export default function PlatformOrganizations() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset,
      ...(search ? { search } : {}),
      ...(activeFilter ? { is_active: activeFilter === 'active' } : {}),
    }),
    [offset, search, activeFilter]
  );

  const { data, error, loading, refetch } = useApi('/platform/organizations', {
    params,
    deps: [offset, search, activeFilter],
  });

  async function toggleActive(org) {
    setBusyId(org.id);
    try {
      await api.patch(`/platform/organizations/${org.id}`, { is_active: !org.is_active });
      notify.success(
        org.is_active ? 'Organization disabled' : 'Organization enabled',
        org.name
      );
      refetch();
    } catch (err) {
      notify.fromError(describeError(err));
    } finally {
      setBusyId(null);
    }
  }

  if (creating) {
    return (
      <>
        <PageHeader
          breadcrumbs={[
            { label: 'Organizations', to: '/platform/organizations', onClick: (e) => { e.preventDefault(); setCreating(false); } },
            { label: 'New' },
          ]}
          title="Create organization"
        />
        <CreateOrganizationForm
          onCreated={() => {
            setCreating(false);
            refetch();
          }}
          onCancel={() => setCreating(false)}
        />
      </>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Organization',
      sortable: false,
      render: (row) => <span style={{ fontWeight: 'var(--fw-medium)' }}>{row.name}</span>,
    },
    {
      key: 'id',
      header: 'Identifier',
      sortable: false,
      render: (row) => (
        <span className="cx-mono" title={row.id}>
          {shortId(row.id, 12)}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: false,
      render: (row) => (
        <Badge tone={row.is_active ? 'positive' : 'neutral'}>
          {row.is_active ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: 'user_count',
      header: 'Users',
      numeric: true,
      sortable: false,
      render: (row) => <span className="cx-mono">{row.user_count}</span>,
    },
    {
      key: 'case_count',
      header: 'Cases',
      numeric: true,
      sortable: false,
      render: (row) => <span className="cx-mono">{row.case_count}</span>,
    },
    {
      key: 'usage',
      header: 'Usage',
      sortable: false,
      render: () => <span className="cx-muted">Not measured</span>,
    },
    {
      key: 'last_activity',
      header: 'Last activity',
      sortable: false,
      render: (row) => (
        <span title={row.last_activity || undefined}>
          <Value value={formatRelative(row.last_activity)} absent="No activity" />
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: false,
      render: (row) => <Value value={formatDateTime(row.created_at)} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="cx-row" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" onClick={() => navigate(`/platform/organizations/${row.id}`)}>
            View
          </Button>
          <Button
            size="sm"
            variant={row.is_active ? 'default' : 'primary'}
            onClick={() => toggleActive(row)}
            disabled={busyId === row.id}
          >
            {busyId === row.id ? '…' : row.is_active ? 'Disable' : 'Enable'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Institutions provisioned on the platform. There is no self-service signup."
        actions={
          <>
            <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
              Create organization
            </Button>
            <Button onClick={refetch} disabled={loading}>
              Refresh
            </Button>
          </>
        }
      />

      <Panel flush>
        <DataTable
          columns={columns}
          rows={data?.items || []}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={refetch}
          caption="Organizations"
          emptyTitle="No organizations"
          emptyMessage={
            search || activeFilter
              ? 'No organizations match the current filters.'
              : 'Create the first organization to onboard an institution.'
          }
          emptyAction={
            !search && !activeFilter ? (
              <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
                Create organization
              </Button>
            ) : null
          }
          total={data?.total}
          limit={PAGE_SIZE}
          offset={offset}
          onPageChange={setOffset}
          onRowClick={(row) => navigate(`/platform/organizations/${row.id}`)}
          rowAriaLabel={(row) => `Open organization ${row.name}`}
          toolbar={
            <>
              <div style={{ minWidth: 240, flex: '1 1 240px' }}>
                <SearchInput
                  value={search}
                  onChange={(v) => {
                    setSearch(v);
                    setOffset(0);
                  }}
                  placeholder="Search organization name"
                  label="Search organizations"
                />
              </div>
              <div className="cx-table-toolbar__filters">
                <Select
                  label="Status"
                  value={activeFilter}
                  onChange={(v) => {
                    setActiveFilter(v);
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
                  {loading ? '…' : `${data?.total ?? 0} organization${data?.total === 1 ? '' : 's'}`}
                </span>
              </div>
            </>
          }
        />
      </Panel>
    </>
  );
}

export { Building2 };
