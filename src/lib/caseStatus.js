/**
 * Canonical case lifecycle, mirroring app/core/case_status.py on the API.
 *
 * The backend owns the vocabulary and publishes it at GET /cases/statuses.
 * This module is the presentation half: how each state is labelled, which
 * badge tone it carries, and how it is grouped in filters.
 *
 * Two rules the UI must never break:
 *
 *   1. ANALYSIS_INCOMPLETE is not a decision. It gets its own visual treatment
 *      so a credit officer can never read a system failure as an underwriting
 *      conclusion.
 *   2. There is no "Unknown". Every case the API returns carries a real state;
 *      if a value ever arrives that this map does not know, it is shown
 *      verbatim in the neutral tone rather than relabelled.
 */

export const CASE_STATUS = {
  DRAFT: 'DRAFT',
  UPLOADING: 'UPLOADING',
  PROCESSING: 'PROCESSING',
  ANALYSIS_IN_PROGRESS: 'ANALYSIS_IN_PROGRESS',
  READY_FOR_REVIEW: 'READY_FOR_REVIEW',
  IN_REVIEW: 'IN_REVIEW',
  RETURNED: 'RETURNED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  ANALYSIS_INCOMPLETE: 'ANALYSIS_INCOMPLETE',
  FAILED: 'FAILED',
};

export const ALL_STATUSES = Object.values(CASE_STATUS);

const META = {
  DRAFT: { label: 'Draft', tone: 'neutral', description: 'Created; nothing submitted yet.' },
  UPLOADING: { label: 'Uploading', tone: 'info', description: 'Documents are being received.' },
  PROCESSING: { label: 'Processing', tone: 'info', description: 'Queued; extraction underway.' },
  ANALYSIS_IN_PROGRESS: {
    label: 'Analysis in progress',
    tone: 'info',
    description: 'Analysis agents are running.',
  },
  READY_FOR_REVIEW: {
    label: 'Ready for review',
    tone: 'warning',
    description: 'Analysis complete; awaiting an underwriter.',
  },
  IN_REVIEW: { label: 'In review', tone: 'warning', description: 'A reviewer has picked this up.' },
  RETURNED: { label: 'Returned', tone: 'warning', description: 'Sent back to the analyst.' },
  APPROVED: { label: 'Approved', tone: 'positive', description: 'Human decision recorded.' },
  REJECTED: { label: 'Rejected', tone: 'critical', description: 'Human decision recorded.' },
  MANUAL_REVIEW: {
    label: 'Manual review',
    tone: 'warning',
    description: 'Human decision: needs deeper review.',
  },
  ANALYSIS_INCOMPLETE: {
    label: 'Analysis incomplete',
    tone: 'incomplete',
    description:
      'Required analysis did not complete. This is a system failure, not an underwriting conclusion.',
  },
  FAILED: { label: 'Failed', tone: 'critical', description: 'Infrastructure failure.' },
};

/** Presentation metadata for a status. Unknown values pass through verbatim. */
export function statusMeta(status) {
  if (!status) {
    return { label: '—', tone: 'neutral', description: '' };
  }
  return (
    META[status] || {
      label: String(status),
      tone: 'neutral',
      description: '',
    }
  );
}

export function statusLabel(status) {
  return statusMeta(status).label;
}

/** True when the case carries no valid credit decision. */
export function isIncomplete(status) {
  return status === CASE_STATUS.ANALYSIS_INCOMPLETE;
}

/** True when the pipeline is still working and the view should keep polling. */
export function isActive(status) {
  return [
    CASE_STATUS.UPLOADING,
    CASE_STATUS.PROCESSING,
    CASE_STATUS.ANALYSIS_IN_PROGRESS,
  ].includes(status);
}

/** True when a human decision has been recorded. */
export function isDecided(status) {
  return [
    CASE_STATUS.APPROVED,
    CASE_STATUS.REJECTED,
    CASE_STATUS.MANUAL_REVIEW,
  ].includes(status);
}

/** States that belong in an underwriter's queue. */
export const REVIEW_QUEUE_STATUSES = [
  CASE_STATUS.READY_FOR_REVIEW,
  CASE_STATUS.IN_REVIEW,
];

/** Filter groups offered in the case list toolbar. */
export const STATUS_FILTER_GROUPS = [
  {
    label: 'In flight',
    statuses: [
      CASE_STATUS.DRAFT,
      CASE_STATUS.UPLOADING,
      CASE_STATUS.PROCESSING,
      CASE_STATUS.ANALYSIS_IN_PROGRESS,
    ],
  },
  {
    label: 'Awaiting a human',
    statuses: [
      CASE_STATUS.READY_FOR_REVIEW,
      CASE_STATUS.IN_REVIEW,
      CASE_STATUS.RETURNED,
    ],
  },
  {
    label: 'Decided',
    statuses: [
      CASE_STATUS.APPROVED,
      CASE_STATUS.REJECTED,
      CASE_STATUS.MANUAL_REVIEW,
    ],
  },
  {
    label: 'Needs attention',
    statuses: [CASE_STATUS.ANALYSIS_INCOMPLETE, CASE_STATUS.FAILED],
  },
];
