/**
 * ============================================================
 *  CRESEM — Case pipeline chart
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  A horizontal bar of exact case counts per lifecycle state.
 *
 *  The data comes from useCaseCounts(), which reads the real `total`
 *  the API reports for each status filter. Nothing here samples,
 *  estimates or interpolates.
 *
 *  Every requirement from the spec is honoured: title, units, period,
 *  tooltip, and explicit loading / empty / no-data states. When every
 *  count is zero the chart is not drawn at all - an axis with no bars
 *  communicates less than a sentence saying there are no cases.
 */

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState, ErrorState, LoadingState, Panel } from '../ui/primitives';
import { statusMeta } from '../../lib/caseStatus';

// Chart colours are drawn from the semantic tokens so a bar means the same
// thing as the badge with the same label.
const TONE_COLOR = {
  neutral: '#6b7691',
  info: '#2563a8',
  positive: '#1a7a4c',
  warning: '#a86f09',
  critical: '#b02525',
  incomplete: '#b02525',
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
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
      <div style={{ fontWeight: 600 }}>{row.label}</div>
      <div className="cx-mono">
        {row.value} case{row.value === 1 ? '' : 's'}
      </div>
      {row.description ? (
        <div className="cx-muted" style={{ maxWidth: 260, marginTop: 4 }}>
          {row.description}
        </div>
      ) : null}
    </div>
  );
}

export default function PipelineChart({ counts, total, loading, error, onRetry }) {
  const rows = counts
    ? Object.entries(counts)
        .map(([status, value]) => {
          const meta = statusMeta(status);
          return {
            status,
            label: meta.label,
            description: meta.description,
            tone: meta.tone,
            value,
          };
        })
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <Panel
      title="Case pipeline"
      subtitle={
        total === null
          ? 'Count of cases by lifecycle state'
          : `Count of cases by lifecycle state · ${total} case${total === 1 ? '' : 's'} total, all time`
      }
    >
      {error ? (
        <ErrorState error={error} onRetry={onRetry} compact />
      ) : loading ? (
        <LoadingState label="Counting cases" compact />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No cases to chart"
          message="The pipeline chart appears once this organization has at least one case."
          compact
        />
      ) : (
        <div style={{ width: '100%', height: Math.max(180, rows.length * 38) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
              <CartesianGrid horizontal={false} stroke="var(--border-subtle)" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                stroke="var(--border-default)"
                label={{
                  value: 'Cases',
                  position: 'insideBottom',
                  offset: -2,
                  style: { fontSize: 10, fill: 'var(--text-tertiary)' },
                }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={150}
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                stroke="var(--border-default)"
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-hover)' }} />
              <Bar dataKey="value" barSize={16} isAnimationActive={false}>
                {rows.map((row) => (
                  <Cell key={row.status} fill={TONE_COLOR[row.tone] || TONE_COLOR.neutral} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
