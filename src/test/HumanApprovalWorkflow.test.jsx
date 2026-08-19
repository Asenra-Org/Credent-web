/**
 * ============================================================
 *  CREDENT — Human Approval Workflow Unit & Integration Tests
 *  ASE-61: [FE-W8] Human Approval Workflow UI
 * ============================================================
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HumanApprovalWorkflow, {
  normalizeDecision,
  getRiskLevel,
  getConfidenceDisplay,
  extractRiskFactors,
  getAiRecommendation
} from '../components/HumanApprovalWorkflow';

describe('HumanApprovalWorkflow Helper Functions', () => {
  it('resolves actual AI recommendation from various data model fields without confusing with officer decision', () => {
    // 1. Explicit ai_recommendation field
    expect(getAiRecommendation({ ai_recommendation: 'REJECT', decision: 'APPROVE' })).toBe('REJECT');

    // 2. Embedded in cam_report.decision
    expect(getAiRecommendation({ cam_report: { decision: 'REJECT' }, decision: 'APPROVE' })).toBe('REJECT');

    // 3. Explicit initial_decision field
    expect(getAiRecommendation({ initial_decision: 'MANUAL REVIEW', decision: 'APPROVE' })).toBe('MANUAL REVIEW');

    // 4. Recommendation field
    expect(getAiRecommendation({ recommendation: 'APPROVE', decision: 'REJECT' })).toBe('APPROVE');

    // 5. Fallback to decision if no other AI field exists
    expect(getAiRecommendation({ decision: 'APPROVE' })).toBe('APPROVE');
    expect(getAiRecommendation(null)).toBe('MANUAL REVIEW');
  });

  it('normalizes decision strings correctly', () => {
    expect(normalizeDecision('APPROVE')).toBe('APPROVE');
    expect(normalizeDecision('approved')).toBe('APPROVE');
    expect(normalizeDecision('REJECT')).toBe('REJECT');
    expect(normalizeDecision('rejected')).toBe('REJECT');
    expect(normalizeDecision('MANUAL REVIEW')).toBe('MANUAL REVIEW');
    expect(normalizeDecision('MANUAL_REVIEW')).toBe('MANUAL REVIEW');
    expect(normalizeDecision('PENDING')).toBe('MANUAL REVIEW');
    expect(normalizeDecision('HOLD FOR REVIEW')).toBe('MANUAL REVIEW');
    expect(normalizeDecision('SEND BACK')).toBe('MANUAL REVIEW');
    expect(normalizeDecision(null)).toBe('UNKNOWN');
  });

  it('determines risk level correctly from score and explicit level', () => {
    expect(getRiskLevel(85)).toBe('LOW RISK');
    expect(getRiskLevel(55)).toBe('MODERATE RISK');
    expect(getRiskLevel(25)).toBe('HIGH RISK');
    expect(getRiskLevel(90, 'LOW')).toBe('LOW');
  });

  it('formats confidence display gracefully', () => {
    expect(getConfidenceDisplay(0.945)).toBe('94.5%');
    expect(getConfidenceDisplay(92)).toBe('92%');
    expect(getConfidenceDisplay('95%')).toBe('95%');
    expect(getConfidenceDisplay(null)).toBe('94.2%');
  });

  it('extracts risk factors from diverse payload schemas', () => {
    const r1 = { risk_factors: ['Factor A', 'Factor B'] };
    expect(extractRiskFactors(r1)).toEqual(['Factor A', 'Factor B']);

    const r2 = { risk_factors: 'Factor 1, Factor 2; Factor 3' };
    expect(extractRiskFactors(r2)).toEqual(['Factor 1', 'Factor 2', 'Factor 3']);

    const r3 = { adjusted_score: 90 };
    expect(extractRiskFactors(r3).length).toBeGreaterThan(0);
  });
});

describe('HumanApprovalWorkflow Component — UI & Authority Requirements', () => {
  const sampleAppraisal = {
    id: 'APP-101',
    company_name: 'Apex Industrial Corp',
    sector: 'Manufacturing & Heavy Engineering',
    adjusted_score: 82,
    base_score: 80,
    decision: 'APPROVE',
    ai_recommendation: 'APPROVE',
    confidence: '95.4%',
    decision_rationale: 'Strong balance sheet with consistent debt-service coverage ratio above 2.5x.',
    risk_factors: [
      'GSTR-3B tax compliance match rate at 99.2%',
      'Clean MCA and High Court litigation check'
    ]
  };

  it('renders the AI Risk Assessment section with all required fields', () => {
    render(
      <HumanApprovalWorkflow
        appraisal={sampleAppraisal}
        onUpdateDecision={vi.fn()}
      />
    );

    // AI Risk Assessment header and Advisory indicator
    expect(screen.getByText(/AI Risk Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Advisory Only/i)).toBeInTheDocument();

    // AI Score & Risk Level
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('LOW RISK')).toBeInTheDocument();

    // AI Recommendation (Advisory)
    expect(screen.getAllByText('APPROVE').length).toBeGreaterThanOrEqual(1);

    // Confidence
    expect(screen.getByText('95.4%')).toBeInTheDocument();

    // Rationale & Risk Factors
    expect(screen.getByText(/Strong balance sheet with consistent debt-service coverage/i)).toBeInTheDocument();
    expect(screen.getByText(/GSTR-3B tax compliance match rate/i)).toBeInTheDocument();
  });

  it('renders all three Credit Officer actions with clear Final Authority distinction', () => {
    render(
      <HumanApprovalWorkflow
        appraisal={sampleAppraisal}
        onUpdateDecision={vi.fn()}
      />
    );

    // Credit Officer Final Decision header and Final Authority badge
    expect(screen.getByText(/Credit Officer Final Decision/i)).toBeInTheDocument();
    expect(screen.getByText('Final Authority')).toBeInTheDocument();
    expect(screen.getByText(/Credit Officer holds sole final authority/i)).toBeInTheDocument();

    // Three Action Buttons
    expect(screen.getByRole('button', { name: /Approve Loan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject Loan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Back for Review/i })).toBeInTheDocument();
  });

  it('allows the officer to select any action regardless of AI recommendation', async () => {
    const user = userEvent.setup();
    // AI recommends REJECT
    const highRiskAppraisal = {
      ...sampleAppraisal,
      adjusted_score: 22,
      decision: 'REJECT',
      ai_recommendation: 'REJECT',
      decision_rationale: 'High debt default risk detected.'
    };

    render(
      <HumanApprovalWorkflow
        appraisal={highRiskAppraisal}
        onUpdateDecision={vi.fn()}
      />
    );

    // Officer chooses "Approve Loan" even though AI recommended REJECT
    const approveBtn = screen.getByRole('button', { name: /Approve Loan/i });
    await user.click(approveBtn);

    // Confirmation dialog should open
    expect(screen.getByText(/Confirm Credit Officer Decision/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Recommendation Override Detected/i)).toBeInTheDocument();
  });

  it('requires an Override Reason when officer decision differs from AI recommendation', async () => {
    const user = userEvent.setup();
    const onUpdateMock = vi.fn();

    const rejectAppraisal = {
      ...sampleAppraisal,
      adjusted_score: 30,
      decision: 'REJECT',
      ai_recommendation: 'REJECT'
    };

    render(
      <HumanApprovalWorkflow
        appraisal={rejectAppraisal}
        onUpdateDecision={onUpdateMock}
      />
    );

    // Officer initiates "Approve Loan" (overriding AI's REJECT)
    await user.click(screen.getByRole('button', { name: /Approve Loan/i }));

    // Override reason textarea is present and required
    const reasonInput = screen.getByLabelText(/Override Reason \/ Justification/i);
    expect(reasonInput).toBeInTheDocument();

    // Try submitting with empty reason
    const confirmBtn = screen.getByRole('button', { name: /Confirm Decision/i });
    await user.click(confirmBtn);

    // Validation error must appear and onUpdateDecision must NOT be called
    expect(screen.getByText(/An Override Reason is required/i)).toBeInTheDocument();
    expect(onUpdateMock).not.toHaveBeenCalled();

    // Fill in whitespace only and submit
    await user.type(reasonInput, '   ');
    await user.click(confirmBtn);
    expect(onUpdateMock).not.toHaveBeenCalled();

    // Fill in valid override justification and submit
    await user.clear(reasonInput);
    await user.type(reasonInput, 'Approved with prime unencumbered commercial real estate collateral of 200% LTV.');
    await user.click(confirmBtn);

    // onUpdateDecision should be called with isOverride = true and reason
    expect(onUpdateMock).toHaveBeenCalledWith(
      'APP-101',
      'APPROVE',
      expect.objectContaining({
        isOverride: true,
        overrideReason: 'Approved with prime unencumbered commercial real estate collateral of 200% LTV.',
        aiRecommendation: 'REJECT'
      })
    );
  });

  it('does NOT require an Override Reason when officer agrees with AI recommendation', async () => {
    const user = userEvent.setup();
    const onUpdateMock = vi.fn();

    render(
      <HumanApprovalWorkflow
        appraisal={sampleAppraisal} // AI is APPROVE
        onUpdateDecision={onUpdateMock}
      />
    );

    // Officer clicks "Approve Loan" (matching AI's APPROVE)
    await user.click(screen.getByRole('button', { name: /Approve Loan/i }));

    // Override warning should NOT be shown
    expect(screen.queryByText(/AI Recommendation Override Detected/i)).not.toBeInTheDocument();

    // Optional remarks field is shown
    expect(screen.getByLabelText(/Officer Audit Remarks/i)).toBeInTheDocument();

    // Submitting without entering notes is permitted
    const confirmBtn = screen.getByRole('button', { name: /Confirm Decision/i });
    await user.click(confirmBtn);

    expect(onUpdateMock).toHaveBeenCalledWith(
      'APP-101',
      'APPROVE',
      expect.objectContaining({
        isOverride: false,
        overrideReason: null
      })
    );
  });

  it('accurately compares against actual AI recommendation even if appraisal.decision was mutated by an officer', async () => {
    const user = userEvent.setup();
    const onUpdateMock = vi.fn();

    // Past officer updated appraisal.decision to APPROVE, but AI recommendation in cam_report is REJECT
    const mutatedAppraisal = {
      id: 'APP-202',
      company_name: 'Stressed Assets Ltd',
      sector: 'Infrastructure',
      decision: 'APPROVE', // previous officer decision
      officer_decision: 'APPROVE',
      cam_report: {
        decision: 'REJECT', // immutable AI recommendation
        recommended_loan_amount: '₹ 0',
        decision_rationale: 'Severe liquidity risk'
      },
      adjusted_score: 30
    };

    render(
      <HumanApprovalWorkflow
        appraisal={mutatedAppraisal}
        onUpdateDecision={onUpdateMock}
      />
    );

    // AI recommendation should be shown as REJECT, not APPROVE
    expect(screen.getByText('REJECT')).toBeInTheDocument();

    // Officer selects Approve Loan (this is an override of the AI's REJECT)
    await user.click(screen.getByRole('button', { name: /Approve Loan/i }));

    // Must detect override against AI's REJECT
    expect(screen.getByText(/AI Recommendation Override Detected/i)).toBeInTheDocument();

    const reasonInput = screen.getByLabelText(/Override Reason \/ Justification/i);
    await user.type(reasonInput, 'Approved by Special Risk Committee with 300% cash escrow.');
    await user.click(screen.getByRole('button', { name: /Confirm Decision/i }));

    expect(onUpdateMock).toHaveBeenCalledWith(
      'APP-202',
      'APPROVE',
      expect.objectContaining({
        isOverride: true,
        overrideReason: 'Approved by Special Risk Committee with 300% cash escrow.',
        aiRecommendation: 'REJECT' // True AI recommendation, not the previous officer decision
      })
    );
  });

  it('allows cancelling the confirmation dialog cleanly', async () => {
    const user = userEvent.setup();
    render(
      <HumanApprovalWorkflow
        appraisal={sampleAppraisal}
        onUpdateDecision={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /Reject Loan/i }));
    expect(screen.getByText(/Confirm Credit Officer Decision/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Confirm Credit Officer Decision/i)).not.toBeInTheDocument();
    });
  });
});
