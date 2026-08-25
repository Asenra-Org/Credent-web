/**
 * ============================================================
 *  CRESEM — Platform overview (SUPER_ADMIN)
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Backed by GET /platform/overview, /platform/case-trend and
 *  /platform/status-distribution.
 *
 *  Every tile reads its state from the API's `measured` flag. A metric the
 *  platform cannot produce renders as NOT MEASURED with the missing
 *  telemetry named — never as a zero.
 */

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ErrorState,
  EmptyState,
  KpiGrid,
  LoadingState,
  PageHeader,
  Panel,
} from '../../components/ui/primitives';
import { MetricTile, findMetric } from '../../components/ui/NotMeasured';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../lib/format';

const MEASURED_TILES = [
  ['total_organizations', undefined],
  ['active_organizations', undefined],
  ['total_users', undefined],
  ['active_users', undefined],
  ['total_cases', undefined],
  ['cases_this_month', undefined],
  ['completed_cases', undefined],
  ['failed_cases', 'critical'],
  ['total_appraisals', undefined],
  ['analysis_incomplete_appraisals', 'critical'],
];

const UNMEASURED_TILES = [
  'platform_ai_calls',
  'ai_cost',
  'average_processing_time',
  'system_error_rate',
];

const STATUS_COLOR = {
  COMPLETED: '#1a7a4c',
  DEGRADED: '#a86f09',
  FAILED: '#b02525',
  BLOCKED: '#b02525',
  NOT_RECORDED: '#6b7691',
};

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-strong)',
        padding: 'var(--sp-2) var(--sp-3)',
        boxShadow: 'var(--shadow-popover)',
        fontSize: 'var(--fs-sm)',
      }}
    >
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div className="cx-mono">
        {payload[0].value} {unit}
      </div>
    </div>
  );
}

function CaseTrendChart() {
  const { data, error, loading, refetch } = useApi('/platform/case-trend', {
    params: { days: 30 },
    deps: [],
  });

  const rows = (data?.items || []).map((r) => ({ ...r, label: formatDate(r.date) || r.date }));

  return (
    <Panel
      title="Cases created over time"
      subtitle="Cases per day, counted from case creation timestamps · last 30 recorded days"
    >
      {error ? (
        <ErrorState error={error} onRetry={refetch} compact />
      ) : loading ? (
        <LoadingState label="Loading case trend" compact />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No cases recorded"
          message="The trend appears once cases have been created on the platform."
          compact
        />
      ) : (
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                stroke="var(--border-default)"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                stroke="var(--border-default)"
                label={{
                  value: 'Cases',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 10, fill: 'var(--text-tertiary)' },
                }}
              />
              <Tooltip content={<ChartTooltip unit="cases" />} />
              <Line
                type="monotone"
                dataKey="cases"
                stroke="var(--c-accent-600)"
                strokeWidth={2}
                dot={{ r: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

function StatusDistributionChart() {
  const { data, error, loading, refetch } = useApi('/platform/status-distribution', { deps: [] });
  const rows = data?.items || [];

  return (
    <Panel
      title="Appraisal analysis status"
      subtitle="Distribution of the P0-4 execution state across all appraisals · all time"
    >
      {error ? (
        <ErrorState error={error} onRetry={refetch} compact />
      ) : loading ? (
        <LoadingState label="Loading distribution" compact />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No appraisals recorded"
          message="The distribution appears once appraisals have been produced."
          compact
        />
      ) : (
        <div style={{ width: '100%', height: Math.max(160, rows.length * 44) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
              <CartesianGrid horizontal={false} stroke="var(--border-subtle)" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                stroke="var(--border-default)"
              />
              <YAxis
                type="category"
                dataKey="analysis_status"
                width={140}
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                stroke="var(--border-default)"
              />
              <Tooltip content={<ChartTooltip unit="appraisals" />} cursor={{ fill: 'var(--surface-hover)' }} />
              <Bar dataKey="count" barSize={16} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.analysis_status} fill={STATUS_COLOR[r.analysis_status] || '#6b7691'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export default function PlatformOverview() {
  const { data, error, loading, refetch } = useApi('/platform/overview', { deps: [] });
  const metrics = data?.metrics || [];

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Operational state of the CRESEM platform across every organization."
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : loading ? (
        <LoadingState label="Loading platform metrics" />
      ) : (
        <div className="cx-stack">
          <KpiGrid>
            {MEASURED_TILES.map(([key, tone]) => {
              const m = findMetric(metrics, key);
              const critical = tone === 'critical' && m?.measured && m.value > 0;
              return <MetricTile key={key} metric={m} tone={critical ? 'critical' : undefined} />;
            })}
          </KpiGrid>

          <Panel
            title="Not measured"
            subtitle="Specified platform metrics that require telemetry the system does not yet record"
          >
            <KpiGrid>
              {UNMEASURED_TILES.map((key) => (
                <MetricTile key={key} metric={findMetric(metrics, key)} />
              ))}
            </KpiGrid>
          </Panel>

          <CaseTrendChart />
          <StatusDistributionChart />
        </div>
      )}
    </>
  );
}
