import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, ShieldAlert, Key, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function ProfileSettings() {
  const { user, refresh } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mfaUri, setMfaUri] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');

  const handleEnrollMFA = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.post('/auth/mfa/enroll');
      setMfaUri(res.data.provisioning_uri);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initialize MFA enrollment');
    } finally { setLoading(false); }
  };

  const handleActivateMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) return;
    try {
      setLoading(true); setError(null);
      await api.post('/auth/mfa/activate', { code: verificationCode });
      setSuccess('MFA activated successfully!');
      setMfaUri(null); setVerificationCode('');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code');
    } finally { setLoading(false); }
  };

  const handleDisableMFA = async () => {
    if (!window.confirm('Are you sure you want to disable MFA?')) return;
    try {
      setLoading(true); setError(null);
      await api.post('/auth/mfa/disable');
      setSuccess('MFA has been disabled.');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to disable MFA');
    } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-light tracking-tight text-zinc-900">Security Settings</h1>
        <p className="text-zinc-500 mt-2 font-mono text-[10px] uppercase tracking-widest">
          Manage your account security and authentication methods
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm flex items-start gap-3">
          <Shield className="h-5 w-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={"p-3 border "}>
              {user.mfa_enabled ? <Shield className="h-6 w-6 text-green-600" /> : <ShieldAlert className="h-6 w-6 text-zinc-400" />}
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-900">Two-Factor Authentication (2FA)</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-lg">
                Add an extra layer of security to your account.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Status:</span>
                <span className={"text-xs font-medium px-2 py-0.5 border "}>
                  {user.mfa_enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>
          </div>
          <div>
            {user.mfa_enabled ? (
              <button onClick={handleDisableMFA} disabled={loading} className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50">
                Disable 2FA
              </button>
            ) : !mfaUri && (
              <button onClick={handleEnrollMFA} disabled={loading} className="px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                Set up 2FA
              </button>
            )}
          </div>
        </div>

        {mfaUri && !user.mfa_enabled && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h4 className="text-md font-medium text-zinc-900 mb-4">Complete 2FA Setup</h4>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center p-6 bg-gray-50 border border-gray-200">
                <div className="bg-white p-2 border border-gray-200">
                  <QRCodeSVG value={mfaUri} size={160} />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-2">Verify Setup Code</label>
                <div className="flex items-center gap-3 max-w-xs">
                  <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="flex-1 border border-gray-300 p-2.5 text-center font-mono text-lg tracking-widest focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                  <button onClick={handleActivateMFA} disabled={loading || verificationCode.length !== 6} className="px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-medium transition-colors disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                  </button>
                </div>
                <button onClick={() => { setMfaUri(null); setVerificationCode(''); }} className="mt-6 text-sm text-zinc-500 hover:text-zinc-900 underline text-left">Cancel setup</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

