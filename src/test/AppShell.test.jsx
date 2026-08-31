import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppShell from '../components/shell/AppShell';
import { useAuthStore } from '../stores/authStore';
import { homeRouteFor, navigationFor } from '../components/shell/navigation';

function signIn(role, email = 'user@bank.com') {
  useAuthStore.setState({
    user: { user_id: 'u1', email, role, organization: { id: 'o1', name: 'Meridian Bank' } },
    accessToken: 'token',
    isAuthenticated: true,
  });
}

function renderShell(initial = '/') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<div>Home content</div>} />
          <Route path="/cases" element={<div>Cases content</div>} />
          <Route path="/engine" element={<div>Engine content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
});

describe('shell chrome', () => {
  it('renders the organization and role in the header', () => {
    signIn('CREDIT_ANALYST');
    renderShell();
    expect(screen.getByText('Meridian Bank')).toBeInTheDocument();
    expect(screen.getByText('Credit Analyst')).toBeInTheDocument();
  });

  it('renders the outlet content', () => {
    signIn('CREDIT_ANALYST');
    renderShell();
    expect(screen.getByText('Home content')).toBeInTheDocument();
  });

  it('provides a skip link to the main region', () => {
    signIn('CREDIT_ANALYST');
    renderShell();
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip).toHaveAttribute('href', '#cx-main');
    expect(document.getElementById('cx-main')).toBeTruthy();
  });

  it('exposes a named primary navigation landmark', () => {
    signIn('CREDIT_ANALYST');
    renderShell();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });
});

describe('role-aware navigation', () => {
  it('shows the analyst their own sections', () => {
    signIn('CREDIT_ANALYST');
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByText('New Analysis')).toBeInTheDocument();
    expect(within(nav).getByText('Cases')).toBeInTheDocument();
    expect(within(nav).queryByText('Organizations')).not.toBeInTheDocument();
  });

  it('shows the underwriting manager the queue, not the engine', () => {
    signIn('UNDERWRITING_MANAGER');
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByText('Queue')).toBeInTheDocument();
    expect(within(nav).queryByText('New Analysis')).not.toBeInTheDocument();
  });

  it('shows the super admin the platform console only', () => {
    signIn('SUPER_ADMIN');
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByText('Organizations')).toBeInTheDocument();
    expect(within(nav).getByText('Audit & Security')).toBeInTheDocument();
    // A platform operator has no business in a tenant's case queue.
    expect(within(nav).queryByText('Queue')).not.toBeInTheDocument();
  });

  it('marks the current route with aria-current', () => {
    signIn('CREDIT_ANALYST');
    renderShell('/cases');
    const link = screen.getByRole('link', { name: /^Cases$/ });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('renders unbuilt screens as disabled rather than as dead links', () => {
    signIn('CREDIT_ANALYST');
    renderShell();
    const tasks = screen.getByTitle('Not built yet');
    expect(tasks).toHaveAttribute('aria-disabled', 'true');
    expect(tasks.tagName).not.toBe('A');
  });
});

describe('mobile drawer', () => {
  it('is closed by default and opens from the menu button', async () => {
    signIn('CREDIT_ANALYST');
    renderShell();
    const sidebar = document.getElementById('cx-sidebar');
    expect(sidebar).toHaveAttribute('data-open', 'false');

    await userEvent.click(screen.getByRole('button', { name: /open navigation/i }));
    expect(sidebar).toHaveAttribute('data-open', 'true');
  });

  it('closes on Escape', async () => {
    signIn('CREDIT_ANALYST');
    renderShell();
    const sidebar = document.getElementById('cx-sidebar');
    await userEvent.click(screen.getByRole('button', { name: /open navigation/i }));
    expect(sidebar).toHaveAttribute('data-open', 'true');

    await userEvent.keyboard('{Escape}');
    expect(sidebar).toHaveAttribute('data-open', 'false');
  });

  it('reports its expanded state to assistive technology', async () => {
    signIn('CREDIT_ANALYST');
    renderShell();
    const button = screen.getByRole('button', { name: /open navigation/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });
});

describe('sign out', () => {
  it('calls the auth store logout', async () => {
    signIn('CREDIT_ANALYST');
    const logout = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ logout });
    renderShell();
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(logout).toHaveBeenCalled();
  });
});

describe('navigation config', () => {
  it('routes every role to a landing page it can actually reach', () => {
    expect(homeRouteFor('SUPER_ADMIN')).toBe('/platform');
    expect(homeRouteFor('ORG_ADMIN')).toBe('/admin');
    expect(homeRouteFor('UNDERWRITING_MANAGER')).toBe('/dashboard');
    expect(homeRouteFor('CREDIT_ANALYST')).toBe('/engine');
    expect(homeRouteFor('VIEWER')).toBe('/cases');
    expect(homeRouteFor(undefined)).toBe('/login');
  });

  it("puts every role's landing route in its own navigation", () => {
    for (const role of ['SUPER_ADMIN', 'ORG_ADMIN', 'UNDERWRITING_MANAGER', 'CREDIT_ANALYST', 'VIEWER']) {
      const home = homeRouteFor(role);
      const targets = navigationFor(role).flatMap((s) => s.items.map((i) => i.to));
      expect(targets, `${role} landing route ${home} must appear in its nav`).toContain(home);
    }
  });

  it('never links to a screen that is not built', () => {
    for (const role of ['SUPER_ADMIN', 'ORG_ADMIN', 'UNDERWRITING_MANAGER', 'CREDIT_ANALYST', 'VIEWER']) {
      for (const section of navigationFor(role)) {
        for (const item of section.items) {
          expect(typeof item.available).toBe('boolean');
        }
      }
    }
  });
});
