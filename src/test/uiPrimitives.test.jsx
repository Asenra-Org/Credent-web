import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState, ErrorState, Kpi, LoadingState, Value } from '../components/ui/primitives';
import { AnalysisIncompleteNotice, CaseAnalysisNotice, StatusBadge } from '../components/ui/status';
import DataTable from '../components/ui/DataTable';

describe('Value never invents data', () => {
  it('renders an explicit absence marker for null, undefined and empty string', () => {
    for (const v of [null, undefined, '', '   ']) {
      const { unmount } = render(<Value value={v} />);
      expect(screen.getByText('Not recorded')).toBeInTheDocument();
      unmount();
    }
  });

  it('does not substitute a zero for a missing value', () => {
    render(<Value value={null} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders a real zero when the value genuinely is zero', () => {
    render(<Value value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

describe('Kpi never fabricates a metric', () => {
  it('shows "Not measured" rather than 0 when there is no value', () => {
    render(<Kpi label="AI cost" value={null} />);
    expect(screen.getByText('Not measured')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows a real zero count when the API reported zero', () => {
    render(<Kpi label="Failed cases" value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('Not measured')).not.toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('labels ANALYSIS_INCOMPLETE distinctly from MANUAL_REVIEW', () => {
    const { unmount } = render(<StatusBadge status="ANALYSIS_INCOMPLETE" />);
    expect(screen.getByText('Analysis incomplete')).toBeInTheDocument();
    unmount();

    render(<StatusBadge status="MANUAL_REVIEW" />);
    expect(screen.getByText('Manual review')).toBeInTheDocument();
    expect(screen.queryByText('Analysis incomplete')).not.toBeInTheDocument();
  });

  it('gives ANALYSIS_INCOMPLETE its own visual class', () => {
    const { container } = render(<StatusBadge status="ANALYSIS_INCOMPLETE" />);
    expect(container.querySelector('.cx-badge--incomplete')).toBeTruthy();
  });

  it('never renders the word Unknown for an unrecognised status', () => {
    render(<StatusBadge status="BRAND_NEW_STATE" />);
    expect(screen.getByText('BRAND_NEW_STATE')).toBeInTheDocument();
    expect(screen.queryByText(/unknown/i)).not.toBeInTheDocument();
  });
});

describe('AnalysisIncompleteNotice', () => {
  it('states plainly that this is a system failure, not a decision', () => {
    render(<AnalysisIncompleteNotice missingRequired={['financial_health']} />);
    expect(screen.getByText(/system failure, not an underwriting conclusion/i)).toBeInTheDocument();
  });

  it('lists the required components that did not complete', () => {
    render(<AnalysisIncompleteNotice missingRequired={['financial_health', 'cam_generator']} />);
    expect(screen.getByText('financial_health')).toBeInTheDocument();
    expect(screen.getByText('cam_generator')).toBeInTheDocument();
  });

  it('does not guess which component failed when the API did not say', () => {
    render(<AnalysisIncompleteNotice missingRequired={[]} />);
    expect(screen.getByText(/did not report which components failed/i)).toBeInTheDocument();
  });
});

describe('CaseAnalysisNotice', () => {
  it('shows the incomplete banner when decision_allowed is false', () => {
    render(
      <CaseAnalysisNotice
        caseRecord={{ lifecycle_status: 'READY_FOR_REVIEW', decision_allowed: false, missing_required: ['cam_generator'] }}
      />
    );
    expect(screen.getByText(/no credit recommendation/i)).toBeInTheDocument();
  });

  it('shows a degraded notice, not an incomplete one, when the decision stands', () => {
    render(
      <CaseAnalysisNotice
        caseRecord={{
          lifecycle_status: 'READY_FOR_REVIEW',
          decision_allowed: true,
          degraded_components: ['sector_context'],
        }}
      />
    );
    expect(screen.getByText('Analysis degraded')).toBeInTheDocument();
    expect(screen.queryByText(/no credit recommendation/i)).not.toBeInTheDocument();
  });

  it('renders nothing for a clean case', () => {
    const { container } = render(
      <CaseAnalysisNotice
        caseRecord={{ lifecycle_status: 'READY_FOR_REVIEW', decision_allowed: true, degraded_components: [] }}
      />
    );
    expect(container.textContent).toBe('');
  });
});

describe('state blocks', () => {
  it('LoadingState announces itself politely', () => {
    render(<LoadingState label="Loading cases" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('EmptyState shows the screen-specific message', () => {
    render(<EmptyState title="No cases yet" message="Cases appear here once submitted." />);
    expect(screen.getByText('No cases yet')).toBeInTheDocument();
    expect(screen.getByText('Cases appear here once submitted.')).toBeInTheDocument();
  });

  it('ErrorState renders 403 without a retry button', () => {
    render(
      <ErrorState
        error={{ status: 403, title: 'Not permitted', message: 'No access.', action: null }}
        onRetry={() => {}}
      />
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('ErrorState offers retry and a countdown for 429', () => {
    render(
      <ErrorState
        error={{
          status: 429,
          title: 'Rate limit reached',
          message: 'Too many requests.',
          action: 'retry-after',
          retryAfter: 30,
        }}
        onRetry={() => {}}
      />
    );
    expect(screen.getByText(/try again in 30 seconds/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'amount', header: 'Amount', numeric: true },
  ];

  it('shows the empty state rather than an empty grid', () => {
    render(<DataTable columns={columns} rows={[]} emptyTitle="No records" emptyMessage="Nothing here." />);
    expect(screen.getByText('No records')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows a loading state instead of rows', () => {
    render(<DataTable columns={columns} rows={[]} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows an error state and calls onRetry', async () => {
    const onRetry = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={[]}
        error={{ status: 500, title: 'Server error', message: 'Failed.', action: 'retry' }}
        onRetry={onRetry}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders rows and marks absent cells explicitly', () => {
    render(
      <DataTable
        columns={columns}
        rows={[{ id: 1, name: 'Acme Steel', amount: null }]}
        rowKey={(r) => r.id}
      />
    );
    expect(screen.getByText('Acme Steel')).toBeInTheDocument();
    expect(screen.getByText('Not recorded')).toBeInTheDocument();
  });

  it('sorts client-side when no server handler is supplied', async () => {
    render(
      <DataTable
        columns={columns}
        rows={[
          { id: 1, name: 'Zenith', amount: 2 },
          { id: 2, name: 'Acme', amount: 1 },
        ]}
        rowKey={(r) => r.id}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    const cells = screen.getAllByRole('cell').map((c) => c.textContent);
    expect(cells[0]).toBe('Acme');
  });

  it('exposes sort state to assistive technology', async () => {
    render(<DataTable columns={columns} rows={[{ id: 1, name: 'A', amount: 1 }]} rowKey={(r) => r.id} />);
    await userEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
  });
});
