/**
 * ============================================================
 *  CRESEM — Platform case operations (SUPER_ADMIN)
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Backed by GET /platform/cases, which returns operational metadata only.
 *
 *  This screen exists so an operator can see whether the pipeline is
 *  healthy across tenants — how many cases are stuck, failing, or gated.
 *  It is deliberately NOT a credit file browser: the endpoint does not
 *  return borrower identity, amounts, decisions, CAM contents or
 *  documents, and the tenant-scoped case API continues to refuse
 *  SUPER_ADMIN entirely.
 */

import React, { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Notice,
  PageHeader,
  Panel,
  Select,
  Value,
} from '../../components/ui/primitives';
import DataTable from '../../components/ui/DataTable';
import { useApi } from '../../hooks/useApi';
import { formatDateTime, formatRelative, humanize, shortId } from '../../lib/format';

const PAGE_SIZE = 50;

// The worker's own vocabulary, which is what this operational view reports.
// The business lifecycle (READY_FOR_REVIEW, ANALYSIS_INCOMPLETE, …) is derived
// inside a tenant and is not exposed to a platform operator.
const WORKER_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'RETRYING', label: 'Retrying' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REJECTED', label: 'Rejected' },
];

function stateTone(status, hasError) {
  if (status === 'FAILED' || status === 'REJECTED' || hasError) return 'critical';
  if (status === 'COMPLETED') return 'positive';
  if (status === 'PAUSED') return 'warning';
  return 'info';
}

export default function PlatformCases() {
  const [organizationId, setOrganizationId] = useState('');
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);

  const { data: orgData } = useApi('/platform/organizations', {
    params: { limit: 200 },
    deps: [],
  });

  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset,
      ...(organizationId ? { organization_id: organizationId } : {}),
      ...(status ? { status } : {}),
    }),
    [offset, organizationId, status]
  );

  const { data, error, loading, refetch } = useApi('/platform/cases', {
    params,
    deps: [offset, organizationId, status],
  });

  const orgNames = useMemo(() => {
    const map = {};
    (orgData?.items || []).forEach((o) => {
      map[o.id] = o.name;
    });
    return map;
  }, [orgData]);

  const columns = [
    {
      key: 'case_id',
      header: 'Case',
      sortable: false,
      render: (r) => (
        <span className="cx-mono" title={r.case_id}>
          {shortId(r.case_id, 14)}
        </span>
      ),
    },
    {
      key: 'organization_id',
      header: 'Organization',
      sortable: false,
      render: (r) => (
        <Value value={orgNames[r.organization_id] || shortId(r.organization_id, 10)} />
      ),
    },
    {
      key: 'status',
      header: 'Processing state',
      sortable: false,
      render: (r) => (
        <Badge tone={stateTone(r.status, r.has_error)}>{humanize(r.status) || r.status}</Badge>
      ),
    },
    {
      key: 'current_step',
      header: 'Step',
      sortable: false,
      render: (r) => <Value value={humanize(r.current_step)} absent="—" />,
    },
    {
      key: 'analysis_status',
      header: 'Analysis',
      sortable: false,
      render: (r) => <Value value={humanize(r.analysis_status)} absent="Not recorded" />,
    },
    {
      key: 'decision_allowed',
      header: 'Gate',
      sortable: false,
      render: (r) => {
        if (r.decision_allowed === null || r.decision_allowed === undefined) {
          return <span className="cx-muted">Not recorded</span>;
        }
        return (
          <Badge tone={r.decision_allowed ? 'positive' : 'incomplete'}>
            {r.decision_allowed ? 'Permitted' : 'Gated'}
          </Badge>
        );
      },
    },
    {
      key: 'has_error',
      header: 'Error',
      sortable: false,
      render: (r) => (r.has_error ? <Badge tone="critical">Yes</Badge> : <span className="cx-muted">—</span>),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: false,
      render: (r) => <Value value={formatDateTime(r.created_at)} />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: false,
      render: (r) => (
        <span title={r.updated_at || undefined}>
          <Value value={formatRelative(r.updated_at)} />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Case operations"
        description="Pipeline state across every organization. Operational metadata only."
        actions={
          <Button onClick={refetch} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="cx-stack">
        <Notice tone="neutral" title="Tenant isolation applies to this screen">
          A platform operator can see that a case exists and what the pipeline did with it. Borrower
          identity, requested amounts, credit decisions, CAM contents and documents are not returned
          by this endpoint, and the tenant case API refuses platform operators outright.
        </Notice>

        <Panel flush>
          <DataTable
            columns={columns}
            rows={data?.items || []}
            rowKey={(r) => r.case_id}
            loading={loading}
            error={error}
            onRetry={refetch}
            caption="Platform case operations"
            emptyTitle="No cases"
            emptyMessage={
              organizationId || status
                ? 'No cases match the current filters.'
                : 'Cases appear here once organizations begin submitting documents.'
            }
            total={data?.total}
            limit={PAGE_SIZE}
            offset={offset}
            onPageChange={setOffset}
            toolbar={
              <>
                <div className="cx-table-toolbar__filters">
                  <Select
                    label="Organization"
                    value={organizationId}
                    onChange={(v) => {
                      setOrganizationId(v);
                      setOffset(0);
                    }}
                    options={(orgData?.items || []).map((o) => ({ value: o.id, label: o.name }))}
                    includeAll
                    allLabel="All organizations"
                  />
                  <Select
                    label="State"
                    value={status}
                    onChange={(v) => {
                      setStatus(v);
                      setOffset(0);
                    }}
                    options={WORKER_STATUSES}
                    includeAll
                    allLabel="All states"
                  />
                </div>
                <span className="cx-muted cx-mono">
                  {loading ? '…' : `${data?.total ?? 0} case${data?.total === 1 ? '' : 's'}`}
                </span>
              </>
            }
          />
        </Panel>
      </div>
    </>
  );
}
