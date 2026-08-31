/**
 * ============================================================
 *  CRESEM — "Not measured" presentation
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  The API returns metrics as { metric, value, measured, requires }.
 *  When `measured` is false the value is null and `requires` names the
 *  telemetry that is missing.
 *
 *  These components render that honestly. A metric the platform cannot
 *  produce shows NOT MEASURED and says what it would take to produce it —
 *  it never falls back to 0, a dash, or an estimate. On an operations
 *  console a zero reads as a measurement, and on a credit platform a
 *  fabricated measurement is worse than an absent one.
 */

import React from 'react';
import { Info } from 'lucide-react';
import { Kpi, Panel } from './primitives';

/** Turn a snake_case metric key into a display label. */
export function metricLabel(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bAi\b/g, 'AI')
    .replace(/\b429\b/g, '429');
}

/**
 * One metric from the API, rendered as a KPI tile.
 *
 * A measured value renders as the number. An unmeasured one renders as
 * NOT MEASURED with the requirement as its note.
 */
export function MetricTile({ metric, tone, format }) {
  if (!metric) return null;

  if (!metric.measured) {
    return (
      <Kpi
        label={metricLabel(metric.metric)}
        value={null}
        unmeasured="NOT MEASURED"
        note={metric.requires}
      />
    );
  }

  const display = format ? format(metric.value) : metric.value;
  return (
    <Kpi
      label={metricLabel(metric.metric)}
      value={display}
      note={metric.unit || undefined}
      tone={tone}
    />
  );
}

/** Look one metric up out of the API's metric array. */
export function findMetric(metrics, key) {
  return (metrics || []).find((m) => m.metric === key) || null;
}

/**
 * A whole panel standing in for a feature whose telemetry does not exist.
 *
 * Used by the AI Operations and Usage pages, which are specified in full but
 * cannot be populated until per-call LLM telemetry is captured. Showing the
 * page with empty charts would imply the numbers are zero; showing nothing
 * would imply the feature was never asked for.
 */
export function NotMeasuredPanel({ title, description, metrics = [] }) {
  return (
    <Panel title={title} subtitle={description}>
      <div className="cx-notice cx-notice--neutral">
        <span className="cx-notice__icon">
          <Info size={16} aria-hidden="true" />
        </span>
        <div>
          <p className="cx-notice__title">Not measured</p>
          <p className="cx-notice__body">
            These metrics are specified, but the platform does not record the telemetry they
            need. They are listed with their requirement rather than shown as zero, which
            would read as a real measurement.
          </p>
        </div>
      </div>

      {metrics.length ? (
        <div className="cx-table-wrap" style={{ marginTop: 'var(--sp-4)' }}>
          <table className="cx-table">
            <caption className="cx-visually-hidden">{title} — unmeasured metrics</caption>
            <thead>
              <tr>
                <th scope="col" style={{ width: '30%' }}>Metric</th>
                <th scope="col" style={{ width: '18%' }}>Status</th>
                <th scope="col">Requires</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.metric}>
                  <th scope="row" style={{ fontWeight: 'var(--fw-medium)' }}>
                    {metricLabel(m.metric)}
                  </th>
                  <td>
                    <span className="cx-badge cx-badge--neutral">
                      <span className="cx-badge__dot" aria-hidden="true" />
                      Not measured
                    </span>
                  </td>
                  <td className="cx-muted">{m.requires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
}
