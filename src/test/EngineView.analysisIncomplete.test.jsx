/**
 * P0 follow-up (item 3): ANALYSIS_INCOMPLETE must never render as a credit
 * decision, and must never fall through to "UNKNOWN".
 */
import { describe, it, expect } from 'vitest';
import { getDecisionStyle, getIncompleteNotice } from '../components/EngineView';

describe('getDecisionStyle — analysis states', () => {
  it('renders ANALYSIS_INCOMPLETE with an explicit label, not UNKNOWN', () => {
    const style = getDecisionStyle('ANALYSIS_INCOMPLETE');
    expect(style.label).toBe('ANALYSIS INCOMPLETE');
    expect(style.label).not.toBe('UNKNOWN');
    expect(style.incomplete).toBe(true);
    expect(style.isDecision).toBe(false);
  });

  it('does not style ANALYSIS_INCOMPLETE like an approval', () => {
    const incomplete = getDecisionStyle('ANALYSIS_INCOMPLETE');
    const approved = getDecisionStyle('APPROVE');
    expect(incomplete.color).not.toBe(approved.color);
    expect(incomplete.Icon).not.toBe(approved.Icon);
  });

  it.each([
    ['APPROVE', 'APPROVE', true],
    ['REJECT', 'REJECT', true],
    ['MANUAL REVIEW', 'MANUAL REVIEW REQUIRED', true],
    ['MANUAL_REVIEW_REQUIRED', 'MANUAL REVIEW REQUIRED', true],
  ])('treats %s as a credit decision', (input, label, isDecision) => {
    const style = getDecisionStyle(input);
    expect(style.label).toBe(label);
    expect(style.isDecision).toBe(isDecision);
  });

  it.each(['ANALYSIS_INCOMPLETE', 'FAILED', 'BLOCKED', 'DEGRADED', 'COMPLETED'])(
    'recognises analysis state %s without falling back to UNKNOWN',
    (state) => {
      const style = getDecisionStyle(state);
      expect(style.label).not.toBe('UNKNOWN');
      expect(style.isDecision).toBe(false);
    }
  );

  it('still degrades safely for a genuinely unknown value', () => {
    expect(getDecisionStyle(null).label).toBe('AWAITING RESULT');
    expect(getDecisionStyle(undefined).label).toBe('AWAITING RESULT');
  });
});

describe('getIncompleteNotice', () => {
  it('returns null for a completed appraisal', () => {
    expect(getIncompleteNotice({
      decision: 'APPROVE', analysis_status: 'COMPLETED', decision_allowed: true,
    })).toBeNull();
  });

  it('returns null for a degraded but valid appraisal', () => {
    expect(getIncompleteNotice({
      decision: 'APPROVE', analysis_status: 'DEGRADED', decision_allowed: true,
      degraded_components: ['risk_intelligence'],
    })).toBeNull();
  });

  it('produces the institutional message when required analysis failed', () => {
    const notice = getIncompleteNotice({
      decision: 'ANALYSIS_INCOMPLETE',
      analysis_status: 'FAILED',
      decision_allowed: false,
      missing_required: ['financial_health', 'cam_generator'],
      degraded_components: ['financial_health', 'cam_generator', 'sector_context'],
    });
    expect(notice.title).toBe('Analysis Incomplete');
    expect(notice.message).toBe(
      'This case cannot receive a credit recommendation because required analysis could not be completed.'
    );
    expect(notice.status).toBe('FAILED');
    expect(notice.failedComponents).toEqual(['financial_health', 'cam_generator']);
    expect(notice.nextAction).toContain('No underwriting decision has been made.');
  });

  it('distinguishes a security block from a failure', () => {
    const notice = getIncompleteNotice({
      decision: 'ANALYSIS_INCOMPLETE', analysis_status: 'BLOCKED', decision_allowed: false,
    });
    expect(notice.title).toBe('Analysis Blocked');
    expect(notice.message).toContain('security grounds');
    expect(notice.nextAction).toContain('security team');
  });

  it('triggers on decision_allowed=false even if status is absent', () => {
    expect(getIncompleteNotice({ decision_allowed: false })).not.toBeNull();
  });
});
