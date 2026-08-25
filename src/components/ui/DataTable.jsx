/**
 * ============================================================
 *  CRESEM — Enterprise data table
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  One table used across every list in the product: cases, users,
 *  organizations, audit events, documents.
 *
 *  Supports search, sort, pagination, row actions, row click-through,
 *  and explicit loading / empty / error states. Server-side and
 *  client-side operation are both supported: pass `onSortChange` /
 *  `onPageChange` to drive the server, or omit them to sort and
 *  paginate the rows you already have.
 *
 *  The table never invents a cell. A column whose accessor returns
 *  null renders the absence marker, not a zero.
 */

import React, { useMemo, useState } from 'react';
import {
  Button,
  EmptyState,
  ErrorState,
  SkeletonRows,
  SortIcon,
  Value,
} from './primitives';

function defaultCompare(a, b) {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

export default function DataTable({
  columns,
  rows,
  /** Stable key for each row. */
  rowKey = (row, i) => row.id ?? i,

  loading = false,
  error = null,
  onRetry,

  /** Empty-state copy, so each screen says something specific. */
  emptyTitle = 'No records',
  emptyMessage,
  emptyAction,

  /** Sorting. Omit onSortChange for client-side sorting. */
  sort,
  direction = 'desc',
  onSortChange,

  /** Pagination. Omit onPageChange for client-side pagination. */
  total,
  limit,
  offset = 0,
  onPageChange,

  /** Row interaction. */
  onRowClick,
  rowAriaLabel,

  /** Toolbar contents rendered above the table. */
  toolbar,

  caption,
}) {
  const [clientSort, setClientSort] = useState({ key: sort ?? null, dir: direction });

  const serverSorted = Boolean(onSortChange);
  const activeSortKey = serverSorted ? sort : clientSort.key;
  const activeSortDir = serverSorted ? direction : clientSort.dir;

  const displayRows = useMemo(() => {
    if (serverSorted || !activeSortKey) return rows;
    const column = columns.find((c) => c.key === activeSortKey);
    if (!column) return rows;
    const accessor = column.sortValue || column.value || ((r) => r[column.key]);
    const sorted = [...rows].sort((a, b) => defaultCompare(accessor(a), accessor(b)));
    return activeSortDir === 'desc' ? sorted.reverse() : sorted;
  }, [rows, columns, activeSortKey, activeSortDir, serverSorted]);

  function toggleSort(key) {
    const nextDir = activeSortKey === key && activeSortDir === 'asc' ? 'desc' : 'asc';
    if (serverSorted) onSortChange(key, nextDir);
    else setClientSort({ key, dir: nextDir });
  }

  const showPagination =
    typeof total === 'number' && typeof limit === 'number' && total > limit;
  const page = limit ? Math.floor(offset / limit) + 1 : 1;
  const pageCount = limit ? Math.max(1, Math.ceil(total / limit)) : 1;

  return (
    <div>
      {toolbar ? <div className="cx-table-toolbar">{toolbar}</div> : null}

      {error ? (
        <ErrorState error={error} onRetry={onRetry} compact />
      ) : loading ? (
        <div style={{ padding: 'var(--sp-2) 0' }}>
          <SkeletonRows rows={6} />
          <span className="cx-visually-hidden" role="status">
            Loading records
          </span>
        </div>
      ) : displayRows.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} compact />
      ) : (
        <div className="cx-table-wrap">
          <table className="cx-table">
            {caption ? <caption className="cx-visually-hidden">{caption}</caption> : null}
            <thead>
              <tr>
                {columns.map((col) => {
                  const isSorted = activeSortKey === col.key;
                  const thClass = col.numeric ? 'cx-table th--numeric' : undefined;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      className={col.numeric ? 'th--numeric' : undefined}
                      style={col.width ? { width: col.width } : undefined}
                      aria-sort={
                        isSorted ? (activeSortDir === 'asc' ? 'ascending' : 'descending') : undefined
                      }
                    >
                      {col.sortable === false ? (
                        col.header
                      ) : (
                        <button
                          type="button"
                          className="cx-table__sort"
                          onClick={() => toggleSort(col.key)}
                        >
                          {col.header}
                          <SortIcon direction={isSorted ? activeSortDir : null} />
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => {
                const clickable = Boolean(onRowClick);
                return (
                  <tr
                    key={rowKey(row, i)}
                    className={clickable ? 'cx-table__row--clickable' : undefined}
                    onClick={clickable ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    tabIndex={clickable ? 0 : undefined}
                    role={clickable ? 'button' : undefined}
                    aria-label={clickable && rowAriaLabel ? rowAriaLabel(row) : undefined}
                  >
                    {columns.map((col) => {
                      const content = col.render
                        ? col.render(row)
                        : <Value value={(col.value || ((r) => r[col.key]))(row)} absent={col.absent} />;
                      return (
                        <td key={col.key} className={col.numeric ? 'td--numeric' : undefined}>
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showPagination && !loading && !error ? (
        <div className="cx-pagination">
          <span>
            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </span>
          <div className="cx-row">
            <Button
              size="sm"
              disabled={offset <= 0}
              onClick={() => onPageChange?.(Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <span className="cx-mono cx-muted">
              {page} / {pageCount}
            </span>
            <Button
              size="sm"
              disabled={offset + limit >= total}
              onClick={() => onPageChange?.(offset + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
