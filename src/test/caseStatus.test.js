import { describe, expect, it } from 'vitest';
import {
  ALL_STATUSES,
  CASE_STATUS,
  isActive,
  isDecided,
  isIncomplete,
  statusLabel,
  statusMeta,
} from '../lib/caseStatus';

describe('case lifecycle vocabulary', () => {
  it('publishes exactly the twelve specified states', () => {
    expect(new Set(ALL_STATUSES)).toEqual(
      new Set([
        'DRAFT',
        'UPLOADING',
        'PROCESSING',
        'ANALYSIS_IN_PROGRESS',
        'READY_FOR_REVIEW',
        'IN_REVIEW',
        'RETURNED',
        'APPROVED',
        'REJECTED',
        'MANUAL_REVIEW',
        'ANALYSIS_INCOMPLETE',
        'FAILED',
      ])
    );
  });

  it('has no "Unknown" state', () => {
    expect(ALL_STATUSES).not.toContain('UNKNOWN');
    expect(ALL_STATUSES).not.toContain('Unknown');
  });

  it('never relabels an unrecognised status as Unknown', () => {
    // A value the UI does not know is shown verbatim rather than invented over.
    expect(statusLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
    expect(statusMeta('SOMETHING_NEW').tone).toBe('neutral');
  });
});

describe('ANALYSIS_INCOMPLETE is not a decision', () => {
  it('is distinct from MANUAL_REVIEW', () => {
    expect(CASE_STATUS.ANALYSIS_INCOMPLETE).not.toBe(CASE_STATUS.MANUAL_REVIEW);
    expect(statusLabel('ANALYSIS_INCOMPLETE')).not.toBe(statusLabel('MANUAL_REVIEW'));
  });

  it('carries its own visual tone so it cannot be mistaken for a decision badge', () => {
    const incomplete = statusMeta('ANALYSIS_INCOMPLETE').tone;
    expect(incomplete).toBe('incomplete');
    expect(incomplete).not.toBe(statusMeta('APPROVED').tone);
    expect(incomplete).not.toBe(statusMeta('REJECTED').tone);
    expect(incomplete).not.toBe(statusMeta('MANUAL_REVIEW').tone);
  });

  it('explains that it is a system failure, not an underwriting conclusion', () => {
    expect(statusMeta('ANALYSIS_INCOMPLETE').description).toMatch(/system failure/i);
  });

  it('is not counted as decided', () => {
    expect(isDecided('ANALYSIS_INCOMPLETE')).toBe(false);
    expect(isIncomplete('ANALYSIS_INCOMPLETE')).toBe(true);
  });

  it('treats only recorded human outcomes as decided', () => {
    expect(isDecided('APPROVED')).toBe(true);
    expect(isDecided('REJECTED')).toBe(true);
    expect(isDecided('MANUAL_REVIEW')).toBe(true);
    expect(isDecided('READY_FOR_REVIEW')).toBe(false);
    expect(isDecided('FAILED')).toBe(false);
  });
});

describe('active states', () => {
  it('identifies the states a view should keep polling', () => {
    expect(isActive('PROCESSING')).toBe(true);
    expect(isActive('ANALYSIS_IN_PROGRESS')).toBe(true);
    expect(isActive('UPLOADING')).toBe(true);
    expect(isActive('READY_FOR_REVIEW')).toBe(false);
    expect(isActive('APPROVED')).toBe(false);
  });
});
