/**
 * ============================================================
 *  CRESEM — Organization overview
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Every KPI on this page is an exact count returned by the API for a
 *  specific status filter (see hooks/useCaseCounts). Nothing is sampled
 *  or estimated.
 *
 *  Metrics the platform does not yet measure - average turnaround,
 *  analyst workload, document failure rate - are deliberately NOT shown
 *  as zero. They are listed as not yet measured, with the reason, so the
 *  page never implies the platform knows something it does not.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  ErrorState,
  Kpi,
  KpiGrid,
  Notice,
  PageHeader,
  Panel,
} from '../components/ui/primitives';
import PipelineChart from '../components/charts/PipelineChart';
import { useCaseCounts } from '../hooks/useCaseCounts';
import { CASE_STATUS } from '../lib/caseStatus';

export default function OrgOverview({
  title = 'Overview',
  description = 'Credit operations across your organization.',
}) {
  const navigate = useNavigate();
  const { counts, total, error, loading, refetch } = useCaseCounts();

  const value = (status) => (counts ? counts[status] ?? 0 : null);

  const inFlight = counts
    ? value(CASE_STATUS.PROCESSING) +
      value(CASE_STATUS.ANALYSIS_IN_PROGRESS) +
      value(CASE_STATUS.UPLOADING)
    : null;

  const decided = counts
    ? value(CASE_STATUS.APPROVED) + value(CASE_STATUS.REJECTED) + value(CASE_STATUS.MANUAL_REVIEW)
    : null;

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button onClick={() => navigate('/cases')}>View all cases</Button>
            <Button onClick={refetch} disabled={loading}>
              Refresh
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <KpiGrid>
            <Kpi label="Total cases" value={loading ? null : total} unmeasured="…" />
            <Kpi label="In flight" value={loading ? null : inFlight} unmeasured="…" note="Uploading, processing or analysing" />
            <Kpi
              label="Ready for review"
              value={loading ? null : value(CASE_STATUS.READY_FOR_REVIEW)}
              unmeasured="…"
              tone={!loading && value(CASE_STATUS.READY_FOR_REVIEW) > 0 ? 'warning' : undefined}
            />
            <Kpi label="In review" value={loading ? null : value(CASE_STATUS.IN_REVIEW)} unmeasured="…" />
            <Kpi label="Returned" value={loading ? null : value(CASE_STATUS.RETURNED)} unmeasured="…" />
            <Kpi label="Decided" value={loading ? null : decided} unmeasured="…" note="Approved, rejected or manual review" />
            <Kpi
              label="Analysis incomplete"
              value={loading ? null : value(CASE_STATUS.ANALYSIS_INCOMPLETE)}
              unmeasured="…"
              tone={!loading && value(CASE_STATUS.ANALYSIS_INCOMPLETE) > 0 ? 'critical' : undefined}
              note="System failures, not decisions"
            />
            <Kpi
              label="Failed"
              value={loading ? null : value(CASE_STATUS.FAILED)}
              unmeasured="…"
              tone={!loading && value(CASE_STATUS.FAILED) > 0 ? 'critical' : undefined}
            />
          </KpiGrid>

          <PipelineChart
            counts={counts}
            total={total}
            loading={loading}
            error={error}
            onRetry={refetch}
          />

          <Panel title="Not yet measured">
            <Notice tone="neutral" title="These metrics are specified but the platform does not record them yet">
              <p style={{ margin: 0 }}>
                Rather than display a zero that would read as a real measurement, they are listed
                here with what each one needs.
              </p>
              <ul className="cx-notice__list">
                <li>
                  <strong>Average turnaround time</strong> — needs a recorded submission and
                  decision timestamp per case.
                </li>
                <li>
                  <strong>Analyst workload</strong> — needs case assignment to be populated;
                  the column exists but nothing writes it yet.
                </li>
                <li>
                  <strong>Risk distribution</strong> — needs a risk grade to be persisted per case.
                </li>
                <li>
                  <strong>Document failure rate</strong> — needs per-document extraction status,
                  which only the batch upload path records today.
                </li>
                <li>
                  <strong>AI usage, latency and cost</strong> — needs per-call LLM telemetry,
                  which is not yet captured.
                </li>
              </ul>
            </Notice>
          </Panel>
        </>
      )}
    </>
  );
}
