/**
 * ============================================================
 *  CRESEM — Usage & cost (SUPER_ADMIN)
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Backed by GET /platform/usage.
 *
 *  Processing volume is real: it is a count of cases per organization.
 *  Token usage and cost are not, and are reported as NOT MEASURED.
 *
 *  Cost in particular is never estimated. A plausible-looking rupee figure
 *  on a platform console would be quoted in a commercial conversation, and
 *  a number invented to fill a tile is worse than an empty one.
 */

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Button,
  EmptyState,
  ErrorState,
  Kpi,
  KpiGrid,
  LoadingState,
  PageHeader,
  Panel,
  Value,
} from '../../components/ui/primitives';
import { NotMeasuredPanel } from '../../components/ui/NotMeasured';
import DataTable from '../../components/ui/DataTable';
import { useApi } from '../../hooks/useApi';
import { formatRelative, shortId } from '../../lib/format';

export default function UsageCost() {
  const { data, error, loading, refetch } = useApi('/platform/usage', { deps: [] });
  const { data: orgData } = useApi('/platform/organizations', {
    params: { limit: 200 },
    deps: [],
  });

  const orgNames = {};
  (orgData?.items || []).forEach((o) => {
    orgNames[o.id] = o.name;
  });

  const volume = (data?.processing_volume || []).map((v) => ({
    ...v,
    label: orgNames[v.organization_id] || shortId(v.organization_id, 10),
  }));

  return (
    <>
      <PageHeader
        title="Usage & cost"
        description="Processing volume by organization. AI consumption and cost are not yet measured."
        actions={
          <Button onClick={refetch} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : loading ? (
        <LoadingState label="Loading usage" />
      ) : (
        <div className="cx-stack">
          <KpiGrid>
            <Kpi label="Organizations with activity" value={volume.length} />
            <Kpi label="Total appraisals" value={data?.total_appraisals} />
            <Kpi label="AI requests" value={null} unmeasured="NOT MEASURED" note="Per-call LLM telemetry" />
            <Kpi label="Estimated cost" value={null} unmeasured="NOT MEASURED" note="Token counts and provider pricing" />
          </KpiGrid>

          <Panel
            title="Processing volume by organization"
            subtitle="Cases processed per organization · all time"
          >
            {volume.length === 0 ? (
              <EmptyState
                title="No processing volume"
                message="Volume appears once organizations begin submitting cases."
                compact
              />
            ) : (
              <div style={{ width: '100%', height: Math.max(180, volume.length * 42) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volume} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                    <CartesianGrid horizontal={false} stroke="var(--border-subtle)" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                      stroke="var(--border-default)"
                      label={{
                        value: 'Cases processed',
                        position: 'insideBottom',
                        offset: -2,
                        style: { fontSize: 10, fill: 'var(--text-tertiary)' },
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={180}
                      tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                      stroke="var(--border-default)"
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--surface-hover)' }}
                      contentStyle={{
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 0,
                        fontSize: 12,
                      }}
                      formatter={(value) => [`${value} cases`, 'Processed']}
                    />
                    <Bar
                      dataKey="cases_processed"
                      barSize={16}
                      fill="var(--c-accent-600)"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel title="Volume detail" flush>
            <DataTable
              columns={[
                {
                  key: 'label',
                  header: 'Organization',
                  sortable: false,
                  render: (r) => <Value value={r.label} />,
                },
                {
                  key: 'cases_processed',
                  header: 'Cases processed',
                  numeric: true,
                  sortable: false,
                  render: (r) => <span className="cx-mono">{r.cases_processed}</span>,
                },
                {
                  key: 'last_activity',
                  header: 'Last activity',
                  sortable: false,
                  render: (r) => (
                    <span title={r.last_activity || undefined}>
                      <Value value={formatRelative(r.last_activity)} absent="No activity" />
                    </span>
                  ),
                },
                {
                  key: 'tokens',
                  header: 'Tokens',
                  sortable: false,
                  render: () => <span className="cx-muted">Not measured</span>,
                },
                {
                  key: 'cost',
                  header: 'Cost',
                  sortable: false,
                  render: () => <span className="cx-muted">Not measured</span>,
                },
              ]}
              rows={volume}
              rowKey={(r) => r.organization_id}
              caption="Processing volume by organization"
              emptyTitle="No usage recorded"
              emptyMessage="Usage appears once organizations begin submitting cases."
            />
          </Panel>

          <NotMeasuredPanel
            title="AI consumption and cost"
            description="These require per-call token accounting and a provider price list"
            metrics={data?.unmeasured || []}
          />
        </div>
      )}
    </>
  );
}
