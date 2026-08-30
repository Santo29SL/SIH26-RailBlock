import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, fallback }) => {
  const { user } = useAuth();

  // Admin always has access
  if (user?.role === 'ADMIN') {
    return <>{children}</>;
  }

  if (user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 max-w-xl mx-auto my-8 text-center shadow-2xl">
      <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-3">
        <ShieldAlert className="w-6 h-6 text-rose-400" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">Access Restricted by Statutory RBAC</h3>
      <p className="text-xs text-rose-200/80 mb-4 leading-relaxed">
        This action/view requires one of the following authorized roles: <span className="font-mono font-bold text-white">{allowedRoles.join(', ')}</span>.
        Your current role is <span className="font-mono font-bold text-amber-300">{user?.role}</span>.
      </p>
      <p className="text-[11px] text-slate-400">
        Tip: Use the role switcher in the top navigation bar to switch demo roles for evaluation.
      </p>
    </div>
  );
};
