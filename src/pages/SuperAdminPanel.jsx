import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { Loader2, Plus, Building2 } from 'lucide-react';

export default function SuperAdminPanel() {
  const { user } = useAuthStore();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/organizations');
      setOrganizations(res.data);
    } catch (err) {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError('');
      setSuccess('');
      
      // 1. Create the organization
      const orgRes = await api.post('/admin/organizations', { name: orgName });
      const newOrgId = orgRes.data.id;
      
      // 2. Invite the first ORG_ADMIN
      await api.post(`/admin/organizations/${newOrgId}/users`, { 
        email: adminEmail, 
        role: 'ORG_ADMIN' 
      });
      
      setOrgName('');
      setAdminEmail('');
      setSuccess(`Organization "${orgRes.data.name}" onboarded successfully with admin ${adminEmail}`);
      await fetchOrganizations();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to onboard organization');
    } finally {
      setCreating(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      padding: '2rem',
    },
    wrapper: {
      maxWidth: '1100px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
    },
    headerCard: {
      backgroundColor: '#ffffff',
      border: '1px solid var(--border-color)',
      padding: '2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 300,
      letterSpacing: '-0.025em',
      color: 'var(--text-dark)',
      margin: 0,
    },
    subtitle: {
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: 'var(--text-muted)',
      marginTop: '0.5rem',
    },
    errorBox: {
      padding: '1rem',
      border: '1px solid #fecaca',
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      fontSize: '13px',
    },
    successBox: {
      padding: '1rem',
      border: '1px solid #bbf7d0',
      backgroundColor: '#f0fdf4',
      color: '#166534',
      fontSize: '13px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '2rem',
    },
    card: {
      backgroundColor: '#ffffff',
      border: '1px solid var(--border-color)',
    },
    cardHeader: {
      padding: '1.5rem',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: '1.125rem',
      fontWeight: 300,
      margin: 0,
    },
    cardBody: {
      padding: '1.5rem',
    },
    formGroup: {
      marginBottom: '1rem',
    },
    label: {
      display: 'block',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: 'var(--text-muted)',
      marginBottom: '0.5rem',
    },
    input: {
      width: '100%',
      padding: '0.625rem',
      border: '1px solid var(--border-color)',
      fontSize: '13px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '0.625rem',
      backgroundColor: '#18181b',
      color: '#fff',
      border: 'none',
      fontSize: '13px',
      fontWeight: 500,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0.5rem',
      cursor: 'pointer',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
      fontSize: '13px',
    },
    th: {
      padding: '1rem',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: 'var(--text-muted)',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-secondary)',
      fontWeight: 'normal',
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid var(--border-subtle)',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        <header style={styles.headerCard}>
          <div>
            <h1 style={styles.title}>Platform Console</h1>
            <p style={styles.subtitle}>Super Admin &middot; CRESEM Platform</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 500 }}>{user?.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end', ...styles.subtitle }}>
              SUPER ADMIN
            </div>
          </div>
        </header>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={styles.successBox}>
            {success}
          </div>
        )}

        <div style={styles.grid}>
          
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Onboard Institution</h2>
            </div>
            <div style={styles.cardBody}>
              <form onSubmit={handleCreateOrg}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Institution Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    style={styles.input}
                    placeholder="e.g. HDFC Bank"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Root Admin Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    style={styles.input}
                    placeholder="admin@institution.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ ...styles.button, opacity: creating ? 0.5 : 1, marginTop: '1.5rem' }}
                >
                  {creating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Plus size={16} /> Create & Invite</>}
                </button>
              </form>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Institutions</h2>
              <div style={styles.subtitle}>{organizations.length} Total</div>
            </div>
            
            {loading ? (
              <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={24} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map(org => (
                      <tr key={org.id}>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                          {org.id.split('-')[0]}...
                        </td>
                        <td style={{ ...styles.td, fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building2 size={14} color="var(--text-muted)" />
                            {org.name}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {organizations.length === 0 && (
                      <tr>
                        <td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No organizations found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
