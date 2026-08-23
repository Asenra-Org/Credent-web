/**
 * ============================================================
 *  CREDENT — ManagerDashboard Human Approval Workflow Tests
 *  ASE-61: [FE-W8] Human Approval Workflow UI
 * ============================================================
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ManagerDashboard from '../components/ManagerDashboard';

// [P1-6] ManagerDashboard renders inside a Router (useNavigate) and fetches
// through the axios instance in ../lib/api, not window.fetch. The old
// global.fetch stub never intercepted anything, so every test hit the network.
vi.mock('../lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
import api from '../lib/api';

const SAMPLE_APPRAISALS = [
  {
    id: 'APP-001',
    company_name: 'Bharat Dynamics Alloy Ltd',
    sector: 'Defense Metallurgy',
    decision: 'REJECT',
    adjusted_score: 35,
    base_score: 35,
    created_at: '2026-08-10T10:00:00Z',
    decision_rationale: 'High debt defaults and revenue fluctuations observed.',
    risk_factors: ['High leverage', 'Inconsistent GST turnover']
  },
  {
    id: 'APP-002',
    company_name: 'Tata Steel Tubes Division',
    sector: 'Infrastructure',
    decision: 'APPROVE',
    adjusted_score: 91,
    base_score: 90,
    created_at: '2026-08-11T10:00:00Z',
    decision_rationale: 'Prime institutional borrower with strong liquidity.',
    risk_factors: ['Stable debt coverage', 'Strong market position']
  }
];

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { status: "success", data: SAMPLE_APPRAISALS } });
  api.patch.mockResolvedValue({ data: { status: "success", data: { updated: true } } });
  api.post.mockResolvedValue({ data: { status: "success", data: { updated: true } } });
});

describe('ManagerDashboard — Human Approval Workflow Integration', () => {
  it('opens the Decision Center drawer when clicking an application ledger row', async () => {
    const user = userEvent.setup();
    render(<ManagerDashboard theme="dark" onExit={() => {}} />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('Bharat Dynamics Alloy Ltd')).toBeInTheDocument());

    // Click row
    await user.click(screen.getByText('Bharat Dynamics Alloy Ltd'));

    // Drawer should open with Decision Center title and Human Approval sections
    expect(screen.getByText('Decision Center')).toBeInTheDocument();
    expect(screen.getByText(/AI Risk Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Advisory Only/i)).toBeInTheDocument();
    expect(screen.getByText(/Credit Officer Final Decision/i)).toBeInTheDocument();
    expect(screen.getByText('Final Authority')).toBeInTheDocument();

    // Check three action buttons exist
    expect(screen.getByRole('button', { name: /Approve Loan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject Loan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Back for Review/i })).toBeInTheDocument();
  });

  it('allows overriding AI recommendation in ManagerDashboard drawer with mandatory override reason', async () => {
    const user = userEvent.setup();
    render(<ManagerDashboard theme="dark" onExit={() => {}} />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('Bharat Dynamics Alloy Ltd')).toBeInTheDocument());
    await user.click(screen.getByText('Bharat Dynamics Alloy Ltd'));

    // AI is REJECT. Officer clicks "Approve Loan" (override)
    await user.click(screen.getByRole('button', { name: /Approve Loan/i }));

    // Override dialog appears
    expect(screen.getByText(/AI Recommendation Override Detected/i)).toBeInTheDocument();

    const reasonInput = screen.getByLabelText(/Override Reason \/ Justification/i);
    expect(reasonInput).toBeInTheDocument();

    // Submit with reason
    await user.type(reasonInput, 'Approved by Board committee based on government defense contracts.');
    await user.click(screen.getByRole('button', { name: /Confirm Decision/i }));

    // The override is submitted through api.patch(url, body), not window.fetch.
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        expect.stringContaining('/reports/update-status/APP-001'),
        expect.objectContaining({
          override_reason: expect.stringContaining('Approved by Board committee based on government defense contracts'),
        })
      );
    });
  });

  it('can close the Decision Center drawer cleanly', async () => {
    const user = userEvent.setup();
    render(<ManagerDashboard theme="dark" onExit={() => {}} />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByText('Tata Steel Tubes Division')).toBeInTheDocument());
    await user.click(screen.getByText('Tata Steel Tubes Division'));

    expect(screen.getByText('Decision Center')).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByLabelText('Close Decision Center');
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Decision Center')).not.toBeInTheDocument();
    });
  });
});
