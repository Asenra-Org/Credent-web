/**
 * ============================================================
 *  CRESEM — Audit event explorer
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Backed by GET /api/v1/audit/events and GET /api/v1/audit/verify.
 *  Available to ORG_ADMIN (own organization) and SUPER_ADMIN (any).
 *
 *  The chain verification result is reported exactly as the API returns
 *  it. A chain that fails verification is shown as failed - it is never
 *  softened, because a broken audit chain is the single most important
 *  thing an operator needs to know.
 */

import React, { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import {
  Badge,
  Button,
  Notice,
  PageHeader,
  Panel,
  SearchInput,
  Value,
} from '../components/ui/primitives';
import { useApi } from '../hooks/useApi';
import api from '../lib/api';
import { describeError } from '../lib/apiError';
import { notify } from '../stores/notificationStore';
import { formatDateTime, shortId } from '../lib/format';

const PAGE_SIZE = 50;

export default function AuditLogPage({ organizationId }) {
  const [action, setAction] = useState('');
  const [offset, setOffset] = useState(0);
  const [chain, setChain] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset,
      ...(action ? { action } : {}),
      ...(organizationId ? { organization_id: organizationId } : {}),
    }),
    [offset, action, organizationId]
  );

  const { data, error, loading, refetch } = useApi('/audit/events', {
    params,
    deps: [offset, action, organizationId],
  });

  async function verifyChain() {
    setVerifying(true);
    try {
      const res = await api.get('/audit/verify', {
        params: organizationId ? { organization_id: organizationId } : undefined,
      });
      setChain(res.data.chain);
      if (res.data.chain?.status === 'valid') {
        notify.success('Audit chain verified', `Chain intact (${res.data.chain.length ?? 0} events).`);
      } else {
        notify.error('Audit chain verification failed', res.data.chain?.reason || 'The chain is not valid.');
      }
    } catch (err) {
      const described = describeError(err);
      notify.fromError(described);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Audit & security"
        description="Every recorded action, cryptographically chained and append-only."
        actions={
          <>
            <Button onClick={verifyChain} disabled={verifying} icon={ShieldCheck}>
              {verifying ? 'Verifying…' : 'Verify chain'}
            </Button>
            <Button onClick={refetch} disabled={loading}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="cx-stack">
        {chain ? (
          chain.status === 'valid' ? (
            <Notice tone="info" title="Audit chain intact">
              The HMAC chain was recomputed and every link verified.
              {typeof chain.length === 'number' ? ` ${chain.length} events checked.` : ''}
            </Notice>
          ) : (
            <Notice tone="critical" title="Audit chain verification FAILED">
              {chain.reason || 'The chain could not be verified.'}
            </Notice>
          )
        ) : null}

        <Panel flush>
          <DataTable
            columns={[
              {
                key: 'sequence_number',
                header: 'Seq',
                numeric: true,
                sortable: false,
                render: (r) => <span className="cx-mono">{r.sequence_number}</span>,
              },
              {
                key: 'timestamp',
                header: 'When',
                sortable: false,
                render: (r) => <span title={r.timestamp}>{formatDateTime(r.timestamp) || r.timestamp}</span>,
              },
              {
                key: 'action',
                header: 'Action',
                sortable: false,
                render: (r) => <Badge tone="neutral">{r.action}</Badge>,
              },
              {
                key: 'user_id',
                header: 'Actor',
                sortable: false,
                render: (r) => <span className="cx-mono" title={r.user_id}>{shortId(r.user_id, 10)}</span>,
              },
              {
                key: 'resource_type',
                header: 'Resource',
                sortable: false,
                render: (r) => <Value value={r.resource_type} absent="—" />,
              },
              {
                key: 'case_id',
                header: 'Case',
                sortable: false,
                render: (r) => (
                  <span className="cx-mono" title={r.case_id || undefined}>
                    <Value value={r.case_id ? shortId(r.case_id, 10) : null} absent="—" />
                  </span>
                ),
              },
              {
                key: 'decision',
                header: 'Decision',
                sortable: false,
                render: (r) => <Value value={r.decision} absent="—" />,
              },
              {
                key: 'current_hash',
                header: 'Hash',
                sortable: false,
                render: (r) => (
                  <span className="cx-mono" title={r.current_hash}>
                    {shortId(r.current_hash, 12)}
                  </span>
                ),
              },
            ]}
            rows={data?.items || []}
            rowKey={(r) => r.id}
            loading={loading}
            error={error}
            onRetry={refetch}
            caption="Audit events"
            emptyTitle="No audit events"
            emptyMessage={
              action
                ? `No events recorded with action "${action}".`
                : 'No audit events have been recorded for this organization yet.'
            }
            total={data?.total}
            limit={PAGE_SIZE}
            offset={offset}
            onPageChange={setOffset}
            toolbar={
              <>
                <div style={{ minWidth: 240, flex: '1 1 240px' }}>
                  <SearchInput
                    value={action}
                    onChange={(v) => {
                      setAction(v);
                      setOffset(0);
                    }}
                    placeholder="Filter by exact action, e.g. STATUS_UPDATED"
                    label="Filter by action"
                  />
                </div>
                <span className="cx-muted cx-mono">
                  {loading ? '…' : `${data?.total ?? 0} event${data?.total === 1 ? '' : 's'}`}
                </span>
              </>
            }
          />
        </Panel>
      </div>
    </>
  );
}
