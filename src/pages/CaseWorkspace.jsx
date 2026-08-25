/**
 * ============================================================
 *  CRESEM — Case workspace
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  The primary case screen. Everything on it comes from
 *  GET /api/v1/cases/{id}, which returns { case, appraisal, documents },
 *  plus GET /api/v1/cases/{id}/audit for the trail.
 *
 *  Design rules enforced here:
 *
 *   * If the analysis did not complete, the incomplete banner is the first
 *     thing rendered and no recommendation is shown anywhere on the page.
 *   * A section whose backing data is absent says so. It is never hidden
 *     (which would imply it does not apply) and never filled with a
 *     plausible default.
 *   * Every AI-produced figure is shown alongside its provenance, so a
 *     reviewer can see which model produced what.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ShieldCheck } from 'lucide-react';
import {
  Button,
  EmptyState,
  ErrorState,
  Fact,
  FactList,
  LoadingState,
  Notice,
  PageHeader,
  Panel,
  TabPanel,
  Tabs,
  Value,
} from '../components/ui/primitives';
import { CaseAnalysisNotice, StatusBadge } from '../components/ui/status';
import DataTable from '../components/ui/DataTable';
import { useApi, usePolling } from '../hooks/useApi';
import { isActive, isIncomplete } from '../lib/caseStatus';
import { formatAmount, formatDateTime, formatRelative, humanize, shortId } from '../lib/format';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'cam', label: 'CAM' },
  { id: 'documents', label: 'Documents' },
  { id: 'provenance', label: 'Provenance' },
  { id: 'audit', label: 'Audit trail' },
];

/* ------------------------------------------------------------------
   CAM rendering
   ------------------------------------------------------------------ */

/** A CAM section of simple label/value pairs. */
function CamFacts({ title, data, labels }) {
  if (!data || typeof data !== 'object') {
    return (
      <Panel title={title}>
        <p className="cx-muted">This section was not produced for this case.</p>
      </Panel>
    );
  }
  const entries = Object.entries(labels).filter(([key]) => key in data);
  if (!entries.length) {
    return (
      <Panel title={title}>
        <p className="cx-muted">This section was not produced for this case.</p>
      </Panel>
    );
  }
  return (
    <Panel title={title}>
      <FactList>
        {entries.map(([key, label]) => (
          <Fact key={key} label={label} value={data[key]} absent="Not provided" />
        ))}
      </FactList>
    </Panel>
  );
}

/** A CAM section that is a list of records, rendered as a table. */
function CamTable({ title, rows, columns, empty }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Panel title={title}>
        <p className="cx-muted">{empty}</p>
      </Panel>
    );
  }
  return (
    <Panel title={title} flush>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(_, i) => i}
        caption={title}
        emptyTitle="No entries"
      />
    </Panel>
  );
}

function FiveCs({ fiveCs }) {
  if (!fiveCs || typeof fiveCs !== 'object') {
    return (
      <Panel title="Credit assessment — the five Cs">
        <p className="cx-muted">The five Cs assessment was not produced for this case.</p>
      </Panel>
    );
  }
  const order = ['character', 'capacity', 'capital', 'collateral', 'conditions'];
  return (
    <Panel title="Credit assessment — the five Cs" flush>
      <div className="cx-table-wrap">
        <table className="cx-table">
          <caption className="cx-visually-hidden">Five Cs credit assessment</caption>
          <thead>
            <tr>
              <th scope="col" style={{ width: '12%' }}>C</th>
              <th scope="col" style={{ width: '30%' }}>Evidence</th>
              <th scope="col" style={{ width: '30%' }}>Assessment</th>
              <th scope="col">Risk implication</th>
            </tr>
          </thead>
          <tbody>
            {order.map((key) => {
              const item = fiveCs[key];
              return (
                <tr key={key}>
                  <th scope="row" style={{ textTransform: 'capitalize' }}>{key}</th>
                  <td><Value value={item?.evidence} absent="Not provided" /></td>
                  <td><Value value={item?.assessment} absent="Not provided" /></td>
                  <td><Value value={item?.risk_implication} absent="Not provided" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function CamView({ appraisal, incomplete }) {
  if (incomplete) {
    return (
      <Notice tone="critical" title="No credit appraisal memo available">
        A CAM is not rendered for a case whose required analysis did not complete. Re-run the
        analysis once the failed components are available.
      </Notice>
    );
  }
  if (!appraisal) {
    return (
      <EmptyState
        icon={FileText}
        title="No appraisal yet"
        message="This case has not produced an appraisal. A CAM appears here once analysis completes."
      />
    );
  }

  const cam = appraisal.cam_report || {};
  const rec = cam.recommendation || {};

  return (
    <div className="cx-stack">
      <Panel title="Recommendation" subtitle="Produced by analysis. Not a human decision.">
        <FactList>
          <Fact label="Recommendation" value={rec.decision} absent="Not provided" />
          <Fact label="Adjusted score" value={appraisal.adjusted_score} absent="Not scored" />
          <Fact label="Base score" value={appraisal.base_score} absent="Not scored" />
        </FactList>
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <div className="cx-dl__label">Rationale</div>
          <p style={{ margin: '4px 0 0' }}>
            <Value value={rec.rationale || appraisal.decision_rationale} absent="Not provided" />
          </p>
        </div>
        {Array.isArray(rec.conditions) && rec.conditions.length ? (
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <div className="cx-dl__label">Conditions</div>
            <ul className="cx-notice__list" style={{ paddingLeft: 'var(--sp-5)' }}>
              {rec.conditions.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Panel>

      <CamFacts
        title="Document control"
        data={cam.document_control}
        labels={{
          borrower_name: 'Borrower',
          case_id: 'Case ID',
          appraisal_date: 'Appraisal date',
          status: 'Status',
          version: 'Version',
        }}
      />

      <CamFacts
        title="Executive summary"
        data={cam.executive_summary}
        labels={{
          industry: 'Industry',
          facility_requested: 'Facility requested',
          revenue: 'Revenue',
          ebitda: 'EBITDA',
          pat: 'PAT',
          net_worth: 'Net worth',
          total_debt: 'Total debt',
          dscr: 'DSCR',
          current_ratio: 'Current ratio',
        }}
      />

      <CamFacts
        title="Borrower profile"
        data={cam.borrower_profile}
        labels={{
          legal_name: 'Legal name',
          incorporation_date: 'Incorporated',
          registered_location: 'Registered location',
          business_activity: 'Business activity',
          years_in_operation: 'Years in operation',
          existing_lenders: 'Existing lenders',
        }}
      />

      <CamFacts
        title="Facility"
        data={cam.facility}
        labels={{
          facility_type: 'Type',
          requested_amount: 'Requested amount',
          tenor: 'Tenor',
          repayment_structure: 'Repayment structure',
          security: 'Security',
        }}
      />

      <CamFacts
        title="Management and promoters"
        data={cam.management}
        labels={{
          promoter_background: 'Promoter background',
          management_capability: 'Management capability',
          governance_indicators: 'Governance indicators',
          related_party_concerns: 'Related party concerns',
        }}
      />

      <CamFacts
        title="Business profile"
        data={cam.business}
        labels={{
          business_model: 'Business model',
          revenue_drivers: 'Revenue drivers',
          competitive_position: 'Competitive position',
          industry_characteristics: 'Industry characteristics',
        }}
      />

      <CamTable
        title="Ratio analysis"
        rows={cam.ratios?.key_ratios}
        empty="No ratios were produced for this case."
        columns={[
          { key: 'name', header: 'Ratio', sortable: false },
          { key: 'value', header: 'Value', sortable: false },
          { key: 'interpretation', header: 'Interpretation', sortable: false },
          { key: 'source', header: 'Source', sortable: false },
        ]}
      />

      <CamFacts
        title="Banking conduct"
        data={cam.banking_analysis}
        labels={{
          average_credits: 'Average credits',
          average_debits: 'Average debits',
          emi_servicing: 'EMI servicing',
          cheque_returns: 'Cheque returns',
          analytical_notes: 'Notes',
        }}
      />

      <CamFacts
        title="GST / tax analysis"
        data={cam.tax_analysis}
        labels={{
          gst_turnover: 'GST turnover',
          itr_revenue: 'ITR revenue',
          filing_consistency: 'Filing consistency',
        }}
      />

      <CamTable
        title="Cross-document reconciliation"
        rows={cam.cross_document_verification}
        empty="No cross-document checks were produced for this case."
        columns={[
          { key: 'metric', header: 'Metric', sortable: false },
          { key: 'source_a', header: 'Source A', sortable: false },
          { key: 'source_b', header: 'Source B', sortable: false },
          {
            key: 'consistency',
            header: 'Result',
            sortable: false,
            render: (row) => (
              <span className={row.consistency === 'VARIANCE' ? 'cx-badge cx-badge--warning' : 'cx-badge cx-badge--positive'}>
                <span className="cx-badge__dot" aria-hidden="true" />
                {row.consistency || 'Not stated'}
              </span>
            ),
          },
          { key: 'observation', header: 'Observation', sortable: false },
        ]}
      />

      <CamFacts
        title="Collateral"
        data={cam.collateral}
        labels={{ security_type: 'Security type', valuation: 'Valuation', ltv: 'LTV' }}
      />

      <FiveCs fiveCs={cam.five_cs} />

      <CamTable
        title="Risk assessment"
        rows={cam.risk_assessment?.risks}
        empty="No structured risks were produced for this case."
        columns={[
          { key: 'area', header: 'Area', sortable: false },
          {
            key: 'level',
            header: 'Severity',
            sortable: false,
            render: (row) => {
              const tone =
                row.level === 'HIGH' ? 'critical' : row.level === 'LOW' ? 'positive' : 'warning';
              return (
                <span className={`cx-badge cx-badge--${tone}`}>
                  <span className="cx-badge__dot" aria-hidden="true" />
                  {row.level || 'Not stated'}
                </span>
              );
            },
          },
          { key: 'evidence', header: 'Evidence', sortable: false },
          { key: 'mitigation', header: 'Mitigation', sortable: false },
        ]}
      />

      <CamTable
        title="Positive indicators"
        rows={cam.positive_indicators}
        empty="No positive indicators were recorded."
        columns={[
          { key: 'finding', header: 'Finding', sortable: false },
          { key: 'evidence', header: 'Evidence', sortable: false },
          { key: 'implication', header: 'Implication', sortable: false },
        ]}
      />

      <CamTable
        title="Red flags"
        rows={cam.red_flags}
        empty="No red flags were recorded."
        columns={[
          { key: 'finding', header: 'Finding', sortable: false },
          { key: 'severity', header: 'Severity', sortable: false },
          { key: 'evidence', header: 'Evidence', sortable: false },
          { key: 'implication', header: 'Implication', sortable: false },
        ]}
      />

      <CamTable
        title="Information gaps"
        rows={cam.information_gaps}
        empty="No information gaps were recorded."
        columns={[
          { key: 'requirement', header: 'Requirement', sortable: false },
          { key: 'reason', header: 'Reason', sortable: false },
          { key: 'priority', header: 'Priority', sortable: false },
        ]}
      />

      <CamTable
        title="Evidence register"
        rows={cam.evidence_register}
        empty="No evidence register was produced for this case."
        columns={[
          { key: 'finding', header: 'Finding', sortable: false },
          { key: 'value', header: 'Value', sortable: false },
          { key: 'source_document', header: 'Document', sortable: false },
          { key: 'page', header: 'Page', sortable: false },
          {
            key: 'status',
            header: 'Status',
            sortable: false,
            render: (row) => {
              const tone =
                row.status === 'VERIFIED'
                  ? 'positive'
                  : row.status === 'CONFLICTING'
                  ? 'critical'
                  : row.status === 'MISSING'
                  ? 'warning'
                  : 'neutral';
              return (
                <span className={`cx-badge cx-badge--${tone}`}>
                  <span className="cx-badge__dot" aria-hidden="true" />
                  {row.status || 'Unverified'}
                </span>
              );
            },
          },
        ]}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   Provenance
   ------------------------------------------------------------------ */

function ProvenanceView({ appraisal }) {
  if (!appraisal) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No provenance recorded"
        message="Provenance appears once an appraisal has been produced for this case."
      />
    );
  }

  const agents = Array.isArray(appraisal.agent_provenance) ? appraisal.agent_provenance : [];

  return (
    <div className="cx-stack">
      <Panel
        title="Appraisal-level provenance"
        subtitle="Recorded at the time of the run. Absent values were never captured and are not inferred."
      >
        <FactList>
          <Fact label="Provider" value={appraisal.model_provider} absent="Not recorded" mono />
          <Fact label="Model" value={appraisal.model_name} absent="Not recorded" mono />
          <Fact label="Model version" value={appraisal.model_version} absent="Not recorded" mono />
          <Fact label="Prompt version" value={appraisal.prompt_version} absent="Not recorded" mono />
          <Fact label="Agent version" value={appraisal.agent_version} absent="Not recorded" mono />
          <Fact
            label="Recorded at"
            value={formatDateTime(appraisal.provenance_recorded_at)}
            absent="Not recorded"
          />
        </FactList>
      </Panel>

      <CamTable
        title="Per-agent provenance"
        rows={agents}
        empty="No per-agent provenance was recorded for this appraisal."
        columns={[
          { key: 'agent', header: 'Agent', sortable: false, render: (r) => <span className="cx-mono">{r.agent}</span> },
          { key: 'provider', header: 'Provider', sortable: false, render: (r) => <Value value={r.provider} absent="Not recorded" /> },
          { key: 'model_name', header: 'Model', sortable: false, render: (r) => <Value value={r.model_name} absent="Not recorded" mono /> },
          { key: 'prompt_version', header: 'Prompt', sortable: false, render: (r) => <Value value={r.prompt_version} absent="—" /> },
          { key: 'temperature', header: 'Temp', sortable: false, render: (r) => <Value value={r.temperature} absent="—" /> },
          { key: 'status', header: 'Status', sortable: false },
        ]}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   Audit tab
   ------------------------------------------------------------------ */

function AuditTab({ caseId }) {
  const { data, error, loading, refetch } = useApi(`/cases/${caseId}/audit`, {
    params: { limit: 100 },
    deps: [caseId],
  });

  return (
    <Panel title="Audit trail" subtitle="Hash-linked, append-only." flush>
      <DataTable
        columns={[
          {
            key: 'sequence_number',
            header: '#',
            sortable: false,
            numeric: true,
            render: (r) => <span className="cx-mono">{r.sequence_number}</span>,
          },
          { key: 'action', header: 'Action', sortable: false },
          {
            key: 'user_id',
            header: 'Actor',
            sortable: false,
            render: (r) => <span className="cx-mono">{shortId(r.user_id, 10)}</span>,
          },
          {
            key: 'timestamp',
            header: 'When',
            sortable: false,
            render: (r) => (
              <span title={r.timestamp}>{formatDateTime(r.timestamp) || r.timestamp}</span>
            ),
          },
          {
            key: 'current_hash',
            header: 'Hash',
            sortable: false,
            render: (r) => (
              <span className="cx-mono" title={r.current_hash}>
                {shortId(r.current_hash, 12)}
              </span>
            ),
          },
        ]}
        rows={data?.items || []}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={refetch}
        caption="Case audit trail"
        emptyTitle="No audit events"
        emptyMessage="No audit events have been recorded against this case yet."
      />
    </Panel>
  );
}

/* ------------------------------------------------------------------
   Page
   ------------------------------------------------------------------ */

export default function CaseWorkspace() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const { data, error, loading, refetch } = useApi(`/cases/${caseId}`, { deps: [caseId] });

  const caseRecord = data?.case;
  const appraisal = data?.appraisal;
  const documents = data?.documents || [];

  // Keep the view honest while a pipeline run is in flight.
  usePolling(refetch, isActive(caseRecord?.lifecycle_status), 6000);

  const incomplete = useMemo(
    () =>
      Boolean(
        caseRecord && (isIncomplete(caseRecord.lifecycle_status) || caseRecord.decision_allowed === false)
      ),
    [caseRecord]
  );

  if (loading && !data) return <LoadingState label="Loading case" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!caseRecord) {
    return (
      <EmptyState
        title="Case not found"
        message="This case does not exist, or it belongs to another organization."
        action={<Button onClick={() => navigate('/cases')}>Back to cases</Button>}
      />
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Cases', to: '/cases', onClick: (e) => { e.preventDefault(); navigate('/cases'); } },
          { label: caseRecord.borrower_name || shortId(caseRecord.case_id, 10) },
        ]}
        title={caseRecord.borrower_name || 'Borrower not recorded'}
        description={`Case ${caseRecord.case_reference || caseRecord.case_id}`}
        actions={
          <>
            <StatusBadge status={caseRecord.lifecycle_status} />
            <Button onClick={refetch} disabled={loading}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="cx-stack">
        <CaseAnalysisNotice caseRecord={caseRecord} />

        <Panel>
          <FactList>
            <Fact label="Case ID" value={caseRecord.case_id} mono />
            <Fact label="Facility" value={caseRecord.facility_type} />
            <Fact label="Requested amount" value={formatAmount(caseRecord.requested_amount)} />
            <Fact label="Risk grade" value={caseRecord.risk_grade} absent="Not graded" />
            <Fact label="Analysis status" value={humanize(caseRecord.analysis_status)} absent="Not recorded" />
            <Fact
              label="Decision permitted"
              value={
                caseRecord.decision_allowed === null || caseRecord.decision_allowed === undefined
                  ? null
                  : caseRecord.decision_allowed
                  ? 'Yes'
                  : 'No — analysis incomplete'
              }
              absent="Not recorded"
            />
            <Fact label="Created" value={formatDateTime(caseRecord.created_at)} />
            <Fact label="Last updated" value={formatRelative(caseRecord.updated_at)} />
            <Fact label="Assigned to" value={caseRecord.assigned_to} absent="Unassigned" />
            <Fact label="Reviewed by" value={caseRecord.reviewed_by} absent="Not reviewed" />
          </FactList>
        </Panel>

        <Tabs tabs={TABS} active={tab} onChange={setTab} label="Case sections" />

        <TabPanel id="overview" active={tab}>
          <div className="cx-stack">
            {caseRecord.error_message ? (
              <Notice tone="critical" title="Pipeline error">
                <span className="cx-mono">{caseRecord.error_message}</span>
              </Notice>
            ) : null}
            <Panel title="Processing" subtitle="Live state from the analysis pipeline.">
              <FactList>
                <Fact label="Worker status" value={humanize(caseRecord.status)} absent="Not recorded" />
                <Fact label="Current step" value={humanize(caseRecord.current_step)} absent="Not recorded" />
                <Fact label="Documents" value={documents.length} />
                <Fact label="Appraisal" value={appraisal ? appraisal.id : null} absent="None yet" mono />
              </FactList>
            </Panel>
          </div>
        </TabPanel>

        <TabPanel id="cam" active={tab}>
          <CamView appraisal={appraisal} incomplete={incomplete} />
        </TabPanel>

        <TabPanel id="documents" active={tab}>
          <Panel title="Documents" flush>
            <DataTable
              columns={[
                { key: 'filename', header: 'File', sortable: false },
                { key: 'doc_type', header: 'Type', sortable: false, render: (r) => <Value value={r.doc_type} absent="Unclassified" /> },
                { key: 'page_count', header: 'Pages', numeric: true, sortable: false, render: (r) => <Value value={r.page_count} absent="—" /> },
                { key: 'status', header: 'Status', sortable: false },
                {
                  key: 'created_at',
                  header: 'Uploaded',
                  sortable: false,
                  render: (r) => <Value value={formatDateTime(r.created_at)} />,
                },
              ]}
              rows={documents}
              rowKey={(r) => r.id}
              caption="Case documents"
              emptyTitle="No documents recorded"
              emptyMessage="Documents uploaded through the batch endpoint appear here. Single-file analyses run through the engine are not yet recorded as case documents."
            />
          </Panel>
        </TabPanel>

        <TabPanel id="provenance" active={tab}>
          <ProvenanceView appraisal={appraisal} />
        </TabPanel>

        <TabPanel id="audit" active={tab}>
          <AuditTab caseId={caseId} />
        </TabPanel>
      </div>
    </>
  );
}
