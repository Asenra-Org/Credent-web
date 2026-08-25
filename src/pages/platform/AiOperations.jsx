/**
 * ============================================================
 *  CRESEM — AI / model operations (SUPER_ADMIN)
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Backed by GET /platform/ai-operations.
 *
 *  What is real here is model **provenance**: the P0-2 ledger records which
 *  provider and model produced each appraisal, so every appraisal stays
 *  traceable to the model that produced it. That is shown as measured data.
 *
 *  What is not real — request counts, latency, retries, failovers, 429s,
 *  token usage — has no telemetry behind it. Those are reported as NOT
 *  MEASURED with the missing source named. A latency chart drawn from
 *  nothing would be worse than no chart.
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
  Value,
} from '../../components/ui/primitives';
import { NotMeasuredPanel } from '../../components/ui/NotMeasured';
import DataTable from '../../components/ui/DataTable';
import { useApi } from '../../hooks/useApi';

function ProvenanceTooltip({ active, payload }) {
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
      <div style={{ fontWeight: 600 }}>{row.model}</div>
      <div className="cx-mono">{row.appraisals} appraisals</div>
      {row.gated_appraisals > 0 ? (
        <div className="cx-mono" style={{ color: 'var(--c-critical-600)' }}>
          {row.gated_appraisals} gated
        </div>
      ) : null}
    </div>
  );
}

export default function AiOperations() {
  const { data, error, loading, refetch } = useApi('/platform/ai-operations', { deps: [] });

  const configured = data?.configured || {};
  const provenance = data?.provenance || [];

  return (
    <>
      <PageHeader
        title="AI / model operations"
        description="Which models produced which appraisals, and what the platform cannot yet measure."
        actions={
          <Button onClick={refetch} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : loading ? (
        <LoadingState label="Loading model operations" />
      ) : (
        <div className="cx-stack">
          <Panel
            title="Active provider"
            subtitle="The provider an appraisal would actually run on right now, resolved the same way the agent factory resolves it"
          >
            <FactList>
              <Fact label="Provider" value={configured.provider} absent="Not configured" mono />
              <Fact label="Model" value={configured.primary_model} absent="Not set" mono />
              <Fact label="Endpoint" value={configured.endpoint} absent="Provider default" mono />
              <Fact
                label="Fallback models"
                value={configured.fallback_models?.length ? configured.fallback_models.join(', ') : null}
                absent="None"
                mono
              />
              <Fact label="Max tokens per call" value={configured.max_tokens} absent="Not set" mono />
              <Fact label="Model failover">
                <Badge tone={configured.model_failover_active ? 'positive' : 'warning'}>
                  {configured.model_failover_active ? 'Active' : 'Inactive on this path'}
                </Badge>
              </Fact>
            </FactList>

            {configured.note ? (
              <div style={{ marginTop: 'var(--sp-4)' }}>
                <Notice tone="warning" title="Provider precedence">
                  {configured.note}
                </Notice>
              </div>
            ) : null}
          </Panel>

          <Panel
            title="Model provenance"
            subtitle="Appraisals attributed to the model that produced them · all time"
          >
            <Notice tone="neutral" title="This is appraisal attribution, not a call count">
              One appraisal involves several model calls. The platform records the model per
              appraisal (P0-2 provenance), not per call, so these are appraisal counts.
            </Notice>

            {provenance.length === 0 ? (
              <EmptyState
                title="No appraisals recorded"
                message="Model attribution appears once appraisals have been produced."
                compact
              />
            ) : (
              <>
                <div style={{ width: '100%', height: Math.max(160, provenance.length * 44), marginTop: 'var(--sp-4)' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={provenance}
                      layout="vertical"
                      margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
                    >
                      <CartesianGrid horizontal={false} stroke="var(--border-subtle)" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                        stroke="var(--border-default)"
                        label={{
                          value: 'Appraisals',
                          position: 'insideBottom',
                          offset: -2,
                          style: { fontSize: 10, fill: 'var(--text-tertiary)' },
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="model"
                        width={180}
                        tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                        stroke="var(--border-default)"
                      />
                      <Tooltip content={<ProvenanceTooltip />} cursor={{ fill: 'var(--surface-hover)' }} />
                      <Bar
                        dataKey="appraisals"
                        barSize={16}
                        fill="var(--c-accent-600)"
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ marginTop: 'var(--sp-4)' }}>
                  <DataTable
                    columns={[
                      {
                        key: 'provider',
                        header: 'Provider',
                        sortable: false,
                        render: (r) => <Value value={r.provider} absent="Not recorded" mono />,
                      },
                      {
                        key: 'model',
                        header: 'Model',
                        sortable: false,
                        render: (r) => <span className="cx-mono">{r.model}</span>,
                      },
                      {
                        key: 'appraisals',
                        header: 'Appraisals',
                        numeric: true,
                        sortable: false,
                        render: (r) => <span className="cx-mono">{r.appraisals}</span>,
                      },
                      {
                        key: 'gated_appraisals',
                        header: 'Gated',
                        numeric: true,
                        sortable: false,
                        render: (r) =>
                          r.gated_appraisals > 0 ? (
                            <Badge tone="incomplete">{r.gated_appraisals}</Badge>
                          ) : (
                            <span className="cx-mono cx-muted">0</span>
                          ),
                      },
                    ]}
                    rows={provenance}
                    rowKey={(r, i) => `${r.provider}-${r.model}-${i}`}
                    caption="Model provenance"
                    emptyTitle="No provenance recorded"
                  />
                </div>
              </>
            )}
          </Panel>

          <NotMeasuredPanel
            title="Model telemetry"
            description="Per-call metrics require an llm_call_log that does not exist yet"
            metrics={data?.unmeasured || []}
          />
        </div>
      )}
    </>
  );
}
