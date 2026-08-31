/**
 * ============================================================
 *  CRESEM — Platform configuration (SUPER_ADMIN)
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Backed by GET /platform/configuration.
 *
 *  Read-only by design. Every value here is environment-owned, so an
 *  editable control would be a lie about the system: the form would appear
 *  to save and the process would carry on with the value it booted with.
 *
 *  Secrets are reported as posture only — configured or not configured.
 *  The API never reads the values, so they cannot reach this page.
 */

import React from 'react';
import { Lock } from 'lucide-react';
import {
  Badge,
  Button,
  ErrorState,
  LoadingState,
  Notice,
  PageHeader,
  Panel,
  Value,
} from '../../components/ui/primitives';
import { useApi } from '../../hooks/useApi';

function SettingsTable({ section }) {
  return (
    <Panel title={section.section} flush>
      <div className="cx-table-wrap">
        <table className="cx-table">
          <caption className="cx-visually-hidden">{section.section} settings</caption>
          <thead>
            <tr>
              <th scope="col" style={{ width: '38%' }}>Setting</th>
              <th scope="col" style={{ width: '32%' }}>Value</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {section.settings.map((s) => (
              <tr key={s.key}>
                <th scope="row" className="cx-mono" style={{ fontWeight: 'var(--fw-medium)' }}>
                  {s.key}
                </th>
                <td>
                  {s.sensitive ? (
                    <Badge tone={s.value === 'configured' ? 'positive' : 'warning'}>
                      {s.value === 'configured' ? 'Configured' : 'Not configured'}
                    </Badge>
                  ) : (
                    <span className="cx-mono">
                      <Value value={s.value} absent="Not set" />
                    </span>
                  )}
                </td>
                <td className="cx-muted">
                  {s.sensitive ? (
                    <span className="cx-row" style={{ gap: 6 }}>
                      <Lock size={12} aria-hidden="true" />
                      Secret value is never read by this API
                    </span>
                  ) : (
                    <span>{s.unit ? s.unit : 'Environment configured'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export default function PlatformConfiguration() {
  const { data, error, loading, refetch } = useApi('/platform/configuration', { deps: [] });

  return (
    <>
      <PageHeader
        title="Platform configuration"
        description="Operational settings, as the running process sees them."
        actions={
          <Button onClick={refetch} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : loading ? (
        <LoadingState label="Loading configuration" />
      ) : (
        <div className="cx-stack">
          <Notice tone="neutral" title="Environment configured — read only">
            <p style={{ margin: 0 }}>
              These values are set in the deployment environment and read at process start.
              They are shown here rather than made editable, because a control that appeared to
              save but could not take effect would misrepresent the running system.
            </p>
            <p style={{ margin: 'var(--sp-2) 0 0' }}>
              Secrets are reported as configured or not configured. Their values are never read by
              this API and cannot reach this page.
            </p>
          </Notice>

          {(data?.sections || []).map((section) => (
            <SettingsTable key={section.section} section={section} />
          ))}
        </div>
      )}
    </>
  );
}
