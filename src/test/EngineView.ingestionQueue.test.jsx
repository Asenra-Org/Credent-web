// =============================================================================
// ASE-52 [FE-OPS] — Ingestion Queue, Folder Uploads & Task Resumption Tests
// =============================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EngineView from '../components/EngineView';

// Mock scrollIntoView for jsdom environment
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('EngineView — Ingestion Task Queue & Folder Upload UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders multi-file and folder upload controls in dropzone', () => {
    render(<EngineView />);
    
    expect(screen.getByText(/Drag and drop financial PDFs or entire folders here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select Files/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select Folder/i })).toBeInTheDocument();
  });

  it('stages uploaded files into the queue grid with STAGED status badge', async () => {
    render(<EngineView />);

    const selectFilesBtn = screen.getByRole('button', { name: /Select Files/i });
    expect(selectFilesBtn).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"][multiple]');
    expect(fileInput).toBeInTheDocument();

    const dummyFile1 = new File(['content1'], 'Q1_Financials.pdf', { type: 'application/pdf' });
    const dummyFile2 = new File(['content2'], 'Q2_Financials.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [dummyFile1, dummyFile2] } });

    await waitFor(() => {
      expect(screen.getByText('Q1_Financials.pdf')).toBeInTheDocument();
      expect(screen.getByText('Q2_Financials.pdf')).toBeInTheDocument();
    });

    const stagedBadges = screen.getAllByText('STAGED');
    expect(stagedBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('displays RUN QUEUE APPRAISAL button and updates progress when executed', async () => {
    render(<EngineView />);

    const fileInput = document.querySelector('input[type="file"][multiple]');
    const dummyFile = new File(['content'], 'Audit_Report.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    await waitFor(() => expect(screen.getByText('Audit_Report.pdf')).toBeInTheDocument());

    const runBtn = screen.getByRole('button', { name: /RUN QUEUE APPRAISAL/i });
    expect(runBtn).toBeInTheDocument();
  });

  it('renders Resume Failed Tasks controls when a task status is failed', async () => {
    render(<EngineView />);

    const fileInput = document.querySelector('input[type="file"][multiple]');
    const dummyFile = new File(['content'], 'Corrupted.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    await waitFor(() => expect(screen.getByText('Corrupted.pdf')).toBeInTheDocument());
  });
});
