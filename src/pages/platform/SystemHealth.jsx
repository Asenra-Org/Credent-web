/**
 * ============================================================
 *  CRESEM — System health (SUPER_ADMIN)
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Backed by GET /platform/health, which probes each component at request
 *  time rather than reading a cached verdict.
 *
 *  Restrained indicators: a small state dot and a precise value, not a wall
 *  of green and red. An operator reading this at 3am needs the response time
 *  and the component name, not a traffic light.
 */

import React from 'react';
import {
  Badge,
  Button,
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
import { formatDateTime, humanize } from '../../lib/format';

const STATE_TONE = {
  operational: 'positive',
  configured: 'positive',
  inline: 'info',
  degraded: 'warning',
  not_configured: 'warning',
  failed: 'critical',
};

const COMPONENT_LABEL = {
  api: 'API',
  database: 'Application database',
  authentication: 'Identity store',
  llm_provider: 'LLM provider',
  storage: 'Object storage',
  queue: 'Queue / worker',
};

export default function SystemHealth() {
  const { data, error, loading, refetch } = useApi('/platform/health', { deps: [] });

  const components = data?.components || [];
  const failing = components.filter((c) => c.state === 'failed').length;

  return (
    <>
      <PageHeader
        title="System health"
        description="Component state, probed at request time."
        actions={
          <Button onClick={refetch} disabled={loading}>
            Re-check
          </Button>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : loading ? (
        <LoadingState label="Probing components" />
      ) : (
        <div className="cx-stack">
          <KpiGrid>
            <Kpi label="Components checked" value={components.length} />
            <Kpi
              label="Failing"
              value={failing}
              tone={failing > 0 ? 'critical' : undefined}
            />
            <Kpi
              label="Pipeline failures"
              value={data?.recent_pipeline_failures}
              note="Cases in FAILED or REJECTED state"
              tone={data?.recent_pipeline_failures > 0 ? 'warning' : undefined}
            />
            <Kpi
              label="Last checked"
              value={formatDateTime(data?.checked_at)}
            />
          </KpiGrid>

          <Panel title="Components" flush>
            <DataTable
              columns={[
                {
                  key: 'component',
                  header: 'Component',
                  sortable: false,
                  render: (r) => (
                    <span style={{ fontWeight: 'var(--fw-medium)' }}>
                      {COMPONENT_LABEL[r.component] || r.component}
                    </span>
                  ),
                },
                {
                  key: 'state',
                  header: 'State',
                  sortable: false,
                  render: (r) => (
                    <Badge tone={STATE_TONE[r.state] || 'neutral'}>
                      {humanize(r.state) || r.state}
                    </Badge>
                  ),
                },
                {
                  key: 'detail',
                  header: 'Detail',
                  sortable: false,
                  render: (r) => <span className="cx-mono cx-muted">{r.detail}</span>,
                },
                {
                  key: 'response_ms',
                  header: 'Response',
                  numeric: true,
                  sortable: false,
                  render: (r) =>
                    r.response_ms === null || r.response_ms === undefined ? (
                      <span className="cx-muted">Not probed</span>
                    ) : (
                      <span className="cx-mono">{r.response_ms} ms</span>
                    ),
                },
              ]}
              rows={components}
              rowKey={(r) => r.component}
              caption="Component health"
              emptyTitle="No components reported"
            />
          </Panel>

          <NotMeasuredPanel
            title="Operational telemetry"
            description="Health signals that require instrumentation the platform does not have yet"
            metrics={data?.unmeasured || []}
          />
        </div>
      )}
    </>
  );
}
