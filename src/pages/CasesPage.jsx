/**
 * ============================================================
 *  CRESEM — Case list
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Backed entirely by GET /api/v1/cases, which is tenant-scoped on the
 *  server. Every column reads a field the API actually returns; a case
 *  with no borrower name shows "Not recorded" rather than a placeholder.
 *
 *  Used for the analyst case list, the manager's "All cases" view, and
 *  the org admin's case view. The `queueMode` prop switches it to the
 *  underwriting queue: same data, review-oriented default filter.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/status';
import {
  Button,
  PageHeader,
  Panel,
  SearchInput,
  Select,
  Value,
} from '../components/ui/primitives';
import { useApi } from '../hooks/useApi';
import { REVIEW_QUEUE_STATUSES, STATUS_FILTER_GROUPS } from '../lib/caseStatus';
import { formatAmount, formatRelative, shortId } from '../lib/format';

const PAGE_SIZE = 25;

const STATUS_OPTIONS = STATUS_FILTER_GROUPS.flatMap((group) =>
  group.statuses.map((s) => ({ value: s, label: `${group.label} · ${s.replace(/_/g, ' ')}` }))
);

export default function CasesPage({
  queueMode = false,
  title = 'Cases',
  description = 'Every credit case in your organization.',
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [sort, setSort] = useState('created_at');
  const [direction, setDirection] = useState('desc');
  const [offset, setOffset] = useState(0);

  // The queue defaults to the states awaiting a human, but the filter stays
  // user-controllable so a manager can widen it.
  const effectiveStatus = useMemo(() => {
    if (status) return [status];
    if (queueMode) return REVIEW_QUEUE_STATUSES;
    return undefined;
  }, [status, queueMode]);

  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset,
      sort,
      direction,
      ...(search ? { search } : {}),
      ...(effectiveStatus ? { status: effectiveStatus } : {}),
    }),
    [offset, sort, direction, search, effectiveStatus]
  );

  const { data, error, loading, refetch } = useApi('/cases', {
    params,
    deps: [offset, sort, direction, search, JSON.stringify(effectiveStatus)],
  });

  const rows = data?.items || [];

  function applySearch(value) {
    setSearch(value);
    setOffset(0);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('search', value);
    else next.delete('search');
    setSearchParams(next, { replace: true });
  }

  function applyStatus(value) {
    setStatus(value);
    setOffset(0);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('status', value);
    else next.delete('status');
    setSearchParams(next, { replace: true });
  }

  const columns = [
    {
      key: 'case_id',
      header: 'Case',
      sortable: false,
      render: (row) => (
        <span className="cx-mono" title={row.case_id}>
          {row.case_reference || shortId(row.case_id, 10)}
        </span>
      ),
    },
    {
      key: 'borrower_name',
      header: 'Borrower',
      render: (row) => <Value value={row.borrower_name} />,
    },
    {
      key: 'requested_amount',
      header: 'Requested',
      numeric: true,
      render: (row) => <Value value={formatAmount(row.requested_amount)} />,
    },
    {
      key: 'facility_type',
      header: 'Facility',
      sortable: false,
      render: (row) => <Value value={row.facility_type} />,
    },
    {
      key: 'lifecycle_status',
      header: 'Status',
      sortable: false,
      render: (row) => <StatusBadge status={row.lifecycle_status} />,
    },
    {
      key: 'assigned_to',
      header: 'Assigned',
      sortable: false,
      render: (row) => <Value value={row.assigned_to ? shortId(row.assigned_to, 8) : null} absent="Unassigned" />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      render: (row) => (
        <span title={row.updated_at || undefined}>
          <Value value={formatRelative(row.updated_at)} />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={refetch} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <Panel flush>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.case_id}
          loading={loading}
          error={error}
          onRetry={refetch}
          caption="Credit cases"
          emptyTitle={queueMode ? 'Nothing awaiting review' : 'No cases yet'}
          emptyMessage={
            search || status
              ? 'No cases match the current filters.'
              : queueMode
              ? 'Cases appear here once analysis completes and they are ready for an underwriter.'
              : 'Cases appear here once a document has been submitted for analysis.'
          }
          sort={sort}
          direction={direction}
          onSortChange={(key, dir) => {
            setSort(key);
            setDirection(dir);
            setOffset(0);
          }}
          total={data?.total}
          limit={PAGE_SIZE}
          offset={offset}
          onPageChange={setOffset}
          onRowClick={(row) => navigate(`/cases/${row.case_id}`)}
          rowAriaLabel={(row) => `Open case ${row.borrower_name || row.case_id}`}
          toolbar={
            <>
              <div style={{ minWidth: 240, flex: '1 1 240px' }}>
                <SearchInput
                  value={search}
                  onChange={applySearch}
                  placeholder="Search borrower, case ID or reference"
                  label="Search cases"
                />
              </div>
              <div className="cx-table-toolbar__filters">
                <Select
                  label="Status"
                  value={status}
                  onChange={applyStatus}
                  options={STATUS_OPTIONS}
                  includeAll
                  allLabel={queueMode ? 'Awaiting review' : 'All statuses'}
                />
                <span className="cx-muted cx-mono">
                  {loading ? '…' : `${data?.total ?? 0} case${data?.total === 1 ? '' : 's'}`}
                </span>
              </div>
            </>
          }
        />
      </Panel>
    </>
  );
}

export function UnderwritingQueuePage() {
  return (
    <CasesPage
      queueMode
      title="Underwriting queue"
      description="Cases whose analysis has completed and which are awaiting a human decision."
    />
  );
}

export { FolderOpen };
