/**
 * ============================================================
 *  CRESEM — Application shell
 *  © 2026 Asenra. All Rights Reserved.
 * ============================================================
 *
 *  Header, role-aware sidebar, content region, global notifications.
 *
 *  Accessibility:
 *    - skip link to the main region
 *    - <nav aria-label> landmarks and aria-current on the active link
 *    - the mobile drawer traps nothing but returns focus to its trigger,
 *      closes on Escape, and is hidden from assistive tech when closed
 *    - every interactive element is reachable and has a visible focus ring
 *
 *  Responsive: below 1024px the sidebar becomes an overlay drawer.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Settings, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { navigationFor, ROLE_LABEL } from './navigation';
import Toaster from '../ui/Toaster';

function SidebarNav({ role, onNavigate }) {
  const sections = navigationFor(role);

  return (
    <nav className="cx-shell__nav-inner" aria-label="Primary">
      {sections.map((section) => (
        <div className="cx-nav__section" key={section.label}>
          <div className="cx-nav__section-label">{section.label}</div>
          {section.items.map((item) => {
            const Icon = item.icon;

            // Specified but not built yet. Rendered as disabled rather than
            // hidden so the shell does not misrepresent the product, and
            // rather than linked so it cannot route to a blank page.
            if (!item.available) {
              return (
                <span
                  key={item.to}
                  className="cx-nav__link"
                  aria-disabled="true"
                  title="Not built yet"
                  style={{ opacity: 0.45, cursor: 'not-allowed' }}
                >
                  <span className="cx-nav__link-icon">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  {item.label}
                  <span className="cx-visually-hidden"> (not built yet)</span>
                </span>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/platform' || item.to === '/admin'}
                className="cx-nav__link"
                onClick={onNavigate}
              >
                <span className="cx-nav__link-icon">
                  <Icon size={15} aria-hidden="true" />
                </span>
                {item.label}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export default function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  // Escape closes the drawer, which is the behaviour a keyboard user expects
  // from any overlay.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  // A route change should never leave the drawer covering the new page.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const role = user?.role;

  return (
    <div className="cx-app">
      <a className="cx-skip-link" href="#cx-main">
        Skip to main content
      </a>

      <div className="cx-shell">
        <div className="cx-shell__brand">
          <img
            src="/logo.jpg"
            alt=""
            aria-hidden="true"
            className="cx-shell__brand-logo"
          />
          <span className="cx-shell__brand-text">
            <span className="cx-shell__brand-mark">CRESEM</span>
            <span className="cx-shell__brand-sub">by Asenra</span>
          </span>
        </div>

        <header className="cx-shell__header">
          <div className="cx-header__context">
            <button
              type="button"
              ref={menuButtonRef}
              className="cx-header__icon-button cx-shell__menu-button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-expanded={drawerOpen}
              aria-controls="cx-sidebar"
              aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
            >
              {drawerOpen ? <Menu size={18} /> : <Menu size={18} />}
            </button>
            <span className="cx-header__org cx-truncate">
              {user?.organization?.name || 'Organization'}
            </span>
            {role ? <span className="cx-header__role">{ROLE_LABEL[role] || role}</span> : null}
          </div>

          <div className="cx-header__actions">
            <span className="cx-header__role" style={{ border: 'none' }}>
              {user?.email}
            </span>
            <Link
              to="/settings"
              className="cx-header__icon-button"
              aria-label="Profile and security settings"
              title="Profile and security settings"
            >
              <Settings size={16} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="cx-header__icon-button"
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <aside
          id="cx-sidebar"
          className="cx-shell__nav"
          data-open={drawerOpen ? 'true' : 'false'}
          inert={undefined}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '0 var(--sp-2)',
            }}
          >
            {drawerOpen ? (
              <button
                type="button"
                className="cx-btn cx-btn--ghost cx-btn--sm"
                onClick={closeDrawer}
                aria-label="Close navigation menu"
              >
                <X size={14} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <SidebarNav role={role} onNavigate={() => setDrawerOpen(false)} />
        </aside>

        <main className="cx-shell__main" id="cx-main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {drawerOpen ? (
        <div
          className="cx-scrim"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      ) : null}

      <Toaster />
    </div>
  );
}
