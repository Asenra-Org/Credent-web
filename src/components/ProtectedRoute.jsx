import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Shield, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ requiredRoles }) {
  const { isAuthenticated, user, refresh, hasAnyRole } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        try {
          await refresh();
        } catch (err) {
          // Not authenticated
        }
      }
      setIsChecking(false);
    };
    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400 mx-auto mb-3" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Verifying Session</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center border border-zinc-200 p-12">
          <Shield className="w-8 h-8 text-zinc-300 mx-auto mb-4" />
          <h1 className="text-xl font-light tracking-tight text-zinc-900 mb-2">Access Denied</h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Insufficient permissions for this resource</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
