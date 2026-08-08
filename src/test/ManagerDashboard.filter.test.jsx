// =============================================================================
// ASE-51 [QA-W6] — Search & Filter UI Interaction Tests
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManagerDashboard from '../components/ManagerDashboard';

// Realistic sample dataset mirroring /history/recent response shape
const SAMPLE_APPRAISALS = [
  { id: '1', company_name: 'Vikram Precision Engineering', decision: 'APPROVE', base_score: 92, created_at: '2026-08-01T10:00:00Z' },
  { id: '2', company_name: 'Shree Balaji Textiles', decision: 'REJECT', base_score: 12, created_at: '2026-08-02T10:00:00Z' },
  { id: '3', company_name: 'Anantara Agro Foods', decision: 'MANUAL REVIEW', base_score: 65, created_at: '2026-08-03T10:00:00Z' },
  { id: '4', company_name: 'Vikram Steel Traders', decision: 'APPROVE', base_score: 88, created_at: '2026-08-04T10:00:00Z' },
];

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ status: 'success', data: SAMPLE_APPRAISALS }),
    })
  );
});

describe('ManagerDashboard — Search filter', () => {
  it('shows all records when search query is empty', async () => {
    render(<ManagerDashboard theme="dark" onExit={() => {}} />);
    await waitFor(() => expect(screen.getByText('Vikram Precision Engineering')).toBeInTheDocument());

    expect(screen.getByText('Shree Balaji Textiles')).toBeInTheDocument();
    expect(screen.getByText('Anantara Agro Foods')).toBeInTheDocument();
    expect(screen.getByText('Vikram Steel Traders')).toBeInTheDocument();
  });

  it('filters records by company name substring, case-insensitively', async () => {
    const user = userEvent.setup();
    render(<ManagerDashboard theme="dark" onExit={() => {}} />);
    await waitFor(() => expect(screen.getByText('Vikram Precision Engineering')).toBeInTheDocument());

    const searchBox = screen.getByPlaceholderText('Search entities...');
    await user.type(searchBox, 'vikram');

    // Both "Vikram" companies should remain
    expect(screen.getByText('Vikram Precision Engineering')).toBeInTheDocument();
    expect(screen.getByText('Vikram Steel Traders')).toBeInTheDocument();
    // Non-matching companies should be filtered out
    expect(screen.queryByText('Shree Balaji Textiles')).not.toBeInTheDocument();
    expect(screen.queryByText('Anantara Agro Foods')).not.toBeInTheDocument();
  });

  it('shows zero results for a search query matching nothing', async () => {
    const user = userEvent.setup();
    render(<ManagerDashboard theme="dark" onExit={() => {}} />);
    await waitFor(() => expect(screen.getByText('Vikram Precision Engineering')).toBeInTheDocument());

    const searchBox = screen.getByPlaceholderText('Search entities...');
    await user.type(searchBox, 'zzznonexistentcompanyzzz');

    expect(screen.queryByText('Vikram Precision Engineering')).not.toBeInTheDocument();
    expect(screen.queryByText('Shree Balaji Textiles')).not.toBeInTheDocument();
    expect(screen.queryByText('Anantara Agro Foods')).not.toBeInTheDocument();
    expect(screen.queryByText('Vikram Steel Traders')).not.toBeInTheDocument();
  });
});

describe('ManagerDashboard — Status filter', () => {
  it('"ALL" filter shows every record regardless of decision', async () => {
    render(<ManagerDashboard theme="dark" onExit={() => {}} />);
    await waitFor(() => expect(screen.getByText('Vikram Precision Engineering')).toBeInTheDocument());

    expect(screen.getAllByText(/APPROVE|REJECT|MANUAL REVIEW/).length).toBeGreaterThanOrEqual(4);
  });

  it('clicking the APPROVE filter shows only approved records', async () => {
    const user = userEvent.setup();
    render(<ManagerDashboard theme="dark" onExit={() => {}} />);
    await waitFor(() => expect(screen.getByText('Vikram Precision Engineering')).toBeInTheDocument());

    const approveButton = screen.getByRole('button', { name: /^APPROVE$/i });
    await user.click(approveButton);

    expect(screen.getByText('Vikram Precision Engineering')).toBeInTheDocument();
    expect(screen.getByText('Vikram Steel Traders')).toBeInTheDocument();
    expect(screen.queryByText('Shree Balaji Textiles')).not.toBeInTheDocument();
    expect(screen.queryByText('Anantara Agro Foods')).not.toBeInTheDocument();
  });

  it('clicking the REJECT filter shows only rejected records', async () => {
    const user = userEvent.setup();
    render(<ManagerDashboard theme="dark" onExit={() => {}} />);
    await waitFor(() => expect(screen.getByText('Vikram Precision Engineering')).toBeInTheDocument());

    const rejectButton = screen.getByRole('button', { name: /^REJECT$/i });
    await user.click(rejectButton);

    expect(screen.getByText('Shree Balaji Textiles')).toBeInTheDocument();
    expect(screen.queryByText('Vikram Precision Engineering')).not.toBeInTheDocument();
    expect(screen.queryByText('Anantara Agro Foods')).not.toBeInTheDocument();
    expect(screen.queryByText('Vikram Steel Traders')).not.toBeInTheDocument();
  });

  it('search and status filter combine correctly (AND logic, not OR)', async () => {
    const user = userEvent.setup();
    render(<ManagerDashboard theme="dark" onExit={() => {}} />);
    await waitFor(() => expect(screen.getByText('Vikram Precision Engineering')).toBeInTheDocument());

    const searchBox = screen.getByPlaceholderText('Search entities...');
    await user.type(searchBox, 'vikram');

    const rejectButton = screen.getByRole('button', { name: /^REJECT$/i });
    await user.click(rejectButton);

    // "vikram" AND "REJECT" together should match nothing — neither Vikram company is rejected
    expect(screen.queryByText('Vikram Precision Engineering')).not.toBeInTheDocument();
    expect(screen.queryByText('Vikram Steel Traders')).not.toBeInTheDocument();
  });
});