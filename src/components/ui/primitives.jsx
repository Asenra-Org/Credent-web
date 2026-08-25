/**
 * ============================================================
 *  CRESEM — Shared enterprise UI primitives
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Small, unopinionated building blocks over the token layer in
 *  styles/tokens.css + styles/app.css. No CSS framework.
 *
 *  Everything here is presentation only. No component fetches, and
 *  no component invents a value: an absent field is rendered as an
 *  explicit "Not recorded", never as a plausible-looking default.
 */

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Info,
  Inbox,
  Loader2,
  Search,
  X,
} from 'lucide-react';

/* ============================================================
   Text / value rendering
   ============================================================ */

/**
 * Render a value that may genuinely be absent.
 *
 * The product rule is that a missing figure is shown as missing. Passing a
 * fallback like "0" or "N/A" here would put a fabricated number in front of a
 * credit officer, so the only fallback is an explicit absence marker.
 */
export function Value({ value, absent = 'Not recorded', mono = false }) {
  const missing =
    value === null || value === undefined || value === '' ||
    (typeof value === 'string' && value.trim() === '');

  if (missing) {
    return <span className="cx-dl__value--absent">{absent}</span>;
  }
  return <span className={mono ? 'cx-dl__value--mono' : undefined}>{value}</span>;
}

/** A labelled fact. Used across case headers and detail panels. */
export function Fact({ label, value, absent, mono, children }) {
  return (
    <div className="cx-dl__item">
      <div className="cx-dl__label">{label}</div>
      <div className="cx-dl__value">
        {children ?? <Value value={value} absent={absent} mono={mono} />}
      </div>
    </div>
  );
}

export function FactList({ children }) {
  return <dl className="cx-dl">{children}</dl>;
}

/* ============================================================
   Buttons
   ============================================================ */

export function Button({
  variant = 'default',
  size,
  icon: Icon,
  children,
  className = '',
  ...rest
}) {
  const classes = [
    'cx-btn',
    variant !== 'default' ? `cx-btn--${variant}` : '',
    size === 'sm' ? 'cx-btn--sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} {...rest}>
      {Icon ? <Icon size={14} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

/* ============================================================
   Panels
   ============================================================ */

export function Panel({ title, subtitle, actions, flush = false, children, id }) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section className="cx-panel" aria-labelledby={headingId} id={id}>
      {(title || actions) && (
        <header className="cx-panel__header">
          <div>
            {title && (
              <h2 className="cx-panel__title" id={headingId}>
                {title}
              </h2>
            )}
            {subtitle && <p className="cx-panel__subtitle">{subtitle}</p>}
          </div>
          {actions ? <div className="cx-row">{actions}</div> : null}
        </header>
      )}
      <div className={`cx-panel__body${flush ? ' cx-panel__body--flush' : ''}`}>
        {children}
      </div>
    </section>
  );
}

/* ============================================================
   Page header + breadcrumbs
   ============================================================ */

export function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav className="cx-breadcrumbs" aria-label="Breadcrumb">
      <ol className="cx-row" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 4 }}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="cx-row" style={{ gap: 4 }}>
              {item.to && !last ? (
                <a href={item.to} onClick={item.onClick}>
                  {item.label}
                </a>
              ) : (
                <span className={last ? 'cx-breadcrumbs__current' : undefined} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <span className="cx-breadcrumbs__sep" aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeader({ title, description, actions, breadcrumbs }) {
  return (
    <>
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="cx-page-header">
        <div style={{ minWidth: 0 }}>
          <h1 className="cx-page-header__title">{title}</h1>
          {description && <p className="cx-page-header__description">{description}</p>}
        </div>
        {actions ? <div className="cx-page-header__actions">{actions}</div> : null}
      </div>
    </>
  );
}

/* ============================================================
   Badges
   ============================================================ */

export function Badge({ tone = 'neutral', children, title }) {
  return (
    <span className={`cx-badge cx-badge--${tone}`} title={title}>
      <span className="cx-badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}

/* ============================================================
   State blocks
   ============================================================ */

export function LoadingState({ label = 'Loading', compact = false }) {
  return (
    <div
      className={`cx-state${compact ? ' cx-state--compact' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="cx-state__icon">
        <Loader2 size={22} className="spin" aria-hidden="true" />
      </span>
      <p className="cx-state__message">{label}…</p>
    </div>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  message,
  icon: Icon = Inbox,
  action,
  compact = false,
}) {
  return (
    <div className={`cx-state${compact ? ' cx-state--compact' : ''}`}>
      <span className="cx-state__icon">
        <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h3 className="cx-state__title">{title}</h3>
      {message && <p className="cx-state__message">{message}</p>}
      {action ? <div className="cx-state__actions">{action}</div> : null}
    </div>
  );
}

/**
 * A failed request, rendered from a describeError() result.
 *
 * 401/403/429 each get their own guidance because the user's next step is
 * completely different in each case.
 */
export function ErrorState({ error, onRetry, compact = false }) {
  if (!error) return null;
  const { status, title, message, retryAfter, correlationId, action } = error;

  return (
    <div className={`cx-state cx-state--error${compact ? ' cx-state--compact' : ''}`} role="alert">
      <span className="cx-state__icon">
        <AlertCircle size={26} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h3 className="cx-state__title">{title}</h3>
      <p className="cx-state__message">{message}</p>

      {status === 429 && retryAfter ? (
        <p className="cx-state__message cx-muted">
          Try again in {retryAfter} second{retryAfter === 1 ? '' : 's'}.
        </p>
      ) : null}

      {correlationId ? (
        <p className="cx-mono cx-muted">Reference {correlationId}</p>
      ) : null}

      {onRetry && (action === 'retry' || action === 'retry-after') ? (
        <div className="cx-state__actions">
          <Button onClick={onRetry}>Try again</Button>
        </div>
      ) : null}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="cx-skeleton cx-skeleton--row" />
      ))}
    </div>
  );
}

/* ============================================================
   Notices
   ============================================================ */

const NOTICE_ICON = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
  neutral: Info,
  success: CheckCircle2,
};

export function Notice({ tone = 'info', title, children, items }) {
  const Icon = NOTICE_ICON[tone] || Info;
  return (
    <div className={`cx-notice cx-notice--${tone === 'success' ? 'info' : tone}`} role={tone === 'critical' ? 'alert' : undefined}>
      <span className="cx-notice__icon">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div style={{ minWidth: 0 }}>
        {title && <p className="cx-notice__title">{title}</p>}
        {children && <div className="cx-notice__body">{children}</div>}
        {items?.length ? (
          <ul className="cx-notice__list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================
   Form controls
   ============================================================ */

let fieldSeq = 0;

export function Field({ label, help, children, htmlFor }) {
  const id = htmlFor || `cx-field-${++fieldSeq}`;
  return (
    <div className="cx-field">
      <label className="cx-label" htmlFor={id}>
        {label}
      </label>
      {typeof children === 'function' ? children(id) : children}
      {help && <span className="cx-help">{help}</span>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search', label = 'Search', ...rest }) {
  return (
    <div className="cx-search">
      <span className="cx-search__icon">
        <Search size={14} aria-hidden="true" />
      </span>
      <input
        type="search"
        className="cx-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        {...rest}
      />
    </div>
  );
}

export function Select({ label, value, onChange, options, includeAll, allLabel = 'All' }) {
  return (
    <label className="cx-row" style={{ gap: 6 }}>
      <span className="cx-label">{label}</span>
      <select
        className="cx-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 'auto' }}
      >
        {includeAll && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ============================================================
   Tabs
   ============================================================ */

export function Tabs({ tabs, active, onChange, label = 'Sections' }) {
  return (
    <div className="cx-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const id = typeof tab === 'string' ? tab : tab.id;
        const text = typeof tab === 'string' ? tab : tab.label;
        const count = typeof tab === 'string' ? undefined : tab.count;
        return (
          <button
            key={id}
            role="tab"
            type="button"
            id={`tab-${id}`}
            aria-selected={active === id}
            aria-controls={`panel-${id}`}
            tabIndex={active === id ? 0 : -1}
            className="cx-tab"
            onClick={() => onChange(id)}
          >
            {text}
            {count !== undefined ? <span className="cx-muted"> ({count})</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ id, active, children }) {
  if (id !== active) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0}>
      {children}
    </div>
  );
}

/* ============================================================
   KPI tiles
   ============================================================ */

/**
 * A single metric.
 *
 * `value` of null/undefined renders as "Not measured" rather than 0. A tile
 * showing 0 for something the platform does not measure would be a fabricated
 * metric, which is the exact failure mode this product must avoid.
 */
export function Kpi({ label, value, note, tone, unmeasured = 'Not measured' }) {
  const missing = value === null || value === undefined;
  const classes = ['cx-kpi', tone ? `cx-kpi--${tone}` : ''].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <span className="cx-kpi__label">{label}</span>
      <span className={`cx-kpi__value${missing ? ' cx-kpi__value--muted' : ''}`}>
        {missing ? unmeasured : value}
      </span>
      {note && <span className="cx-kpi__note">{note}</span>}
    </div>
  );
}

export function KpiGrid({ children }) {
  return <div className="cx-kpi-grid">{children}</div>;
}

/* ============================================================
   Sort indicator (used by DataTable)
   ============================================================ */

export function SortIcon({ direction }) {
  if (direction === 'asc') return <ChevronUp size={12} aria-hidden="true" />;
  if (direction === 'desc') return <ChevronDown size={12} aria-hidden="true" />;
  return <ChevronsUpDown size={12} aria-hidden="true" style={{ opacity: 0.45 }} />;
}

export { X as CloseIcon };
