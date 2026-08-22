import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { Loader2, Plus, Shield } from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CREDIT_ANALYST');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  
  const roles = ['CREDIT_ANALYST', 'UNDERWRITING_MANAGER', 'VIEWER', 'ORG_ADMIN'];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      setInviting(true);
      setError('');
      await api.post('/admin/users/invite', { email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}`, { is_active: !currentStatus });
      await fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="bg-white border border-zinc-200 p-8 rounded-none flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-zinc-900">{user?.organization?.name || 'Organization'} Admin</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mt-2">Manage Users and Permissions</p>
          </div>
          <div className="text-right">
            <div className="font-medium text-zinc-900">{user?.email}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 flex items-center justify-end gap-1 mt-1">
              <Shield className="w-3 h-3" /> {user?.role}
            </div>
          </div>
        </header>

        {error && (
          <div className="p-4 border border-red-200 bg-red-50 text-red-900 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white border border-zinc-200 rounded-none">
              <div className="p-6 border-b border-zinc-200">
                <h2 className="text-xl font-light tracking-tight text-zinc-900">Invite User</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500">Email Address</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="w-full p-2.5 border border-zinc-200 rounded-none focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full p-2.5 border border-zinc-200 rounded-none focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 text-sm bg-white"
                    >
                      {roles.map(r => (
                        <option key={r} value={r}>{r.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="w-full bg-zinc-900 text-white p-2.5 rounded-none font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 flex justify-center items-center text-sm"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Send Invite</>}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border border-zinc-200 rounded-none overflow-hidden">
              <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
                <h2 className="text-xl font-light tracking-tight text-zinc-900">Users</h2>
                <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  {users.length} Total
                </div>
              </div>
              
              {loading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                      <tr>
                        <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-normal">Email</th>
                        <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-normal">Role</th>
                        <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-normal">Status</th>
                        <th className="p-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-normal">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-zinc-50/50">
                          <td className="p-4 text-zinc-900">{u.email}</td>
                          <td className="p-4 text-zinc-600 text-xs">{u.role.replace('_', ' ')}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-1 text-[10px] font-mono uppercase tracking-widest border ${u.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-zinc-200 bg-zinc-100 text-zinc-500'}`}>
                              {u.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => toggleUserStatus(u.id, u.is_active)}
                              disabled={u.id === user?.id}
                              className="text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-30 underline decoration-zinc-300 underline-offset-4"
                            >
                              {u.is_active ? 'Disable' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-zinc-500 text-sm">No users found.</td>
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
    </div>
  );
}
