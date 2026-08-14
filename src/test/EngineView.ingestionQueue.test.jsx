// =============================================================================
// ASE-52 / ASE-59 [FE-OPS] — Ingestion Routing, Queue Staging & Task Tests
// =============================================================================
//
// ASE-59 routing rules (source of truth):
//   1 file  (picker or bare drop) → direct terminal pipeline, no queue
//   2+ files (picker)             → staging queue
//   folder drop                   → staging queue, even if it contains 1 file
//
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EngineView from '../components/EngineView';

// jsdom does not implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Fire a change event on the multi-file <input> with the given File objects. */
const pickFiles = (...files) => {
  const input = document.querySelector('input[type="file"][multiple]');
  expect(input).toBeInTheDocument();
  fireEvent.change(input, { target: { files } });
  return input;
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// 1.  DROPZONE UI — basic control rendering
// ===========================================================================
describe('EngineView — Dropzone controls', () => {
  it('renders the drag-and-drop headline and both picker buttons', () => {
    render(<EngineView />);

    expect(
      screen.getByText(/Drag and drop financial PDFs or entire folders here/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select Files/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select Folder/i })).toBeInTheDocument();
  });
});

// ===========================================================================
// 2.  ASE-59 ROUTING — single file → direct pipeline (no queue)
// ===========================================================================
describe('EngineView — ASE-59: single-file routes to direct pipeline', () => {
  it('does NOT show the staging queue grid when exactly 1 file is picked', async () => {
    render(<EngineView />);

    const singleFile = new File(['content'], 'Single_Audit.pdf', { type: 'application/pdf' });
    pickFiles(singleFile);

    // The queue grid header only appears when queueItems.length > 0
    // Give React a tick to flush state, then confirm queue is absent
    await waitFor(() => {
      expect(
        screen.queryByText(/Ingestion Staging Queue/i)
      ).not.toBeInTheDocument();
    });
  });

  it('does NOT render the RUN QUEUE APPRAISAL button when exactly 1 file is picked', async () => {
    render(<EngineView />);

    const singleFile = new File(['content'], 'Single_Audit.pdf', { type: 'application/pdf' });
    pickFiles(singleFile);

    // The queue action bar (including RUN QUEUE APPRAISAL) must not appear
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /RUN QUEUE APPRAISAL/i })
      ).not.toBeInTheDocument();
    });
  });
});

// ===========================================================================
// 3.  ASE-59 ROUTING — 2+ files → staging queue
// ===========================================================================
describe('EngineView — ASE-59: multi-file routes to staging queue', () => {
  it('stages 2 uploaded files into the queue grid with STAGED status badges', async () => {
    render(<EngineView />);

    const file1 = new File(['c1'], 'Q1_Financials.pdf', { type: 'application/pdf' });
    const file2 = new File(['c2'], 'Q2_Financials.pdf', { type: 'application/pdf' });
    pickFiles(file1, file2);

    await waitFor(() => {
      expect(screen.getByText('Q1_Financials.pdf')).toBeInTheDocument();
      expect(screen.getByText('Q2_Financials.pdf')).toBeInTheDocument();
    });

    const stagedBadges = screen.getAllByText('STAGED');
    expect(stagedBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('shows the RUN QUEUE APPRAISAL button after 2+ files are staged', async () => {
    render(<EngineView />);

    const file1 = new File(['c1'], 'Report_A.pdf', { type: 'application/pdf' });
    const file2 = new File(['c2'], 'Report_B.pdf', { type: 'application/pdf' });
    pickFiles(file1, file2);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /RUN QUEUE APPRAISAL/i })
      ).toBeInTheDocument();
    });
  });

  it('shows the RESUME FAILED TASKS button only when at least one queue item is in failed state', async () => {
    render(<EngineView />);

    // Stage 2 files so the queue grid renders
    const file1 = new File(['c1'], 'Audit_X.pdf', { type: 'application/pdf' });
    const file2 = new File(['c2'], 'Audit_Y.pdf', { type: 'application/pdf' });
    pickFiles(file1, file2);

    await waitFor(() =>
      expect(screen.getByText('Audit_X.pdf')).toBeInTheDocument()
    );

    // While both files are only STAGED (not failed) the resume button must be absent
    expect(
      screen.queryByRole('button', { name: /RESUME FAILED TASKS/i })
    ).not.toBeInTheDocument();
  });
});
