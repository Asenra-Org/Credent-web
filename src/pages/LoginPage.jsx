import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaChallenge, setMfaChallenge] = useState(null);
  
  const { login, verifyMfa, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/engine';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (mfaChallenge) {
        await verifyMfa(mfaChallenge, mfaCode);
        navigate(from, { replace: true });
      } else {
        const result = await login(email, password);
        if (result.mfa_required) {
          setMfaChallenge(result.challenge_token);
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      // Error is handled in store and displayed below
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-none">
        
        <div className="p-8 border-b border-zinc-200 text-center">
          <h1 className="text-3xl font-light tracking-tight text-zinc-900">CRESEM</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mt-2">Institutional Access</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-900 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            {!mfaChallenge ? (
              <>
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-3 border border-zinc-200 rounded-none focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-3 border border-zinc-200 rounded-none focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500">MFA Code</label>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  placeholder="000000"
                  className="w-full p-3 border border-zinc-200 rounded-none focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors text-center tracking-[0.5em] font-mono text-lg"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-900 text-white p-3 rounded-none font-medium hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mfaChallenge ? 'Verify' : 'Sign In')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
