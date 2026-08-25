/**
 * ============================================================
 *  CRESEM — Status presentation
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  The single place the lifecycle vocabulary becomes pixels.
 *
 *  ANALYSIS_INCOMPLETE is treated as a first-class visual state with
 *  its own hatched badge and a dedicated banner, because the whole
 *  point of P0-4 is that a credit officer must be able to tell a
 *  system failure apart from an underwriting conclusion at a glance.
 */

import React from 'react';
import { Badge, Notice } from './primitives';
import { isIncomplete, statusMeta } from '../../lib/caseStatus';

export function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <Badge tone={meta.tone} title={meta.description}>
      {meta.label}
    </Badge>
  );
}

/**
 * The banner shown wherever an incomplete case is displayed.
 *
 * Lists the required components that did not complete, straight from the
 * backend's `missing_required`. Nothing is guessed: when the API did not name
 * the failed components, the banner says the analysis did not complete without
 * pretending to know which part failed.
 */
export function AnalysisIncompleteNotice({ missingRequired = [], degraded = [] }) {
  return (
    <Notice tone="critical" title="Analysis incomplete — no credit recommendation">
      <p style={{ margin: 0 }}>
        Required analysis did not complete for this case. This is a system failure, not an
        underwriting conclusion, and no approve, reject or manual-review decision may be
        recorded from it.
      </p>
      {missingRequired.length ? (
        <>
          <p style={{ margin: 'var(--sp-2) 0 0', fontWeight: 'var(--fw-semibold)' }}>
            Required components that did not complete:
          </p>
          <ul className="cx-notice__list">
            {missingRequired.map((c) => (
              <li key={c} className="cx-mono">
                {c}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p style={{ margin: 'var(--sp-2) 0 0' }} className="cx-muted">
          The API did not report which components failed.
        </p>
      )}
      {degraded.length ? (
        <p style={{ margin: 'var(--sp-2) 0 0' }} className="cx-muted">
          Degraded: <span className="cx-mono">{degraded.join(', ')}</span>
        </p>
      ) : null}
    </Notice>
  );
}

/** Shown when optional components failed but the decision still stands. */
export function DegradedNotice({ degraded = [] }) {
  if (!degraded.length) return null;
  return (
    <Notice tone="warning" title="Analysis degraded">
      <p style={{ margin: 0 }}>
        Optional components did not complete. The credit recommendation remains valid, but
        the assessment is less complete than usual.
      </p>
      <p style={{ margin: 'var(--sp-2) 0 0' }}>
        <span className="cx-mono">{degraded.join(', ')}</span>
      </p>
    </Notice>
  );
}

/**
 * Chooses the right banner for a case, or renders nothing.
 * Callers pass the case object straight from GET /cases/{id}.
 */
export function CaseAnalysisNotice({ caseRecord }) {
  if (!caseRecord) return null;
  const status = caseRecord.lifecycle_status;
  const missing = caseRecord.missing_required || [];
  const degraded = caseRecord.degraded_components || [];

  if (isIncomplete(status) || caseRecord.decision_allowed === false) {
    return <AnalysisIncompleteNotice missingRequired={missing} degraded={degraded} />;
  }
  return <DegradedNotice degraded={degraded} />;
}
