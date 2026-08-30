import React, { useState } from 'react';
import { useAuth, DEMO_PRESETS } from '../context/AuthContext';
import { Train, Shield, Key, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, switchRolePreset, isLoading } = useAuth();
  const [username, setUsername] = useState<string>('controller_ndls');
  const [password, setPassword] = useState<string>('Password123!');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await login(username, password);
      onSuccess();
    } catch (err: any) {
      setErrorMessage('Authentication failed. Please check credentials or select a quick demo role preset.');
    }
  };

  const handleQuickPreset = async (preset: (typeof DEMO_PRESETS)[0]) => {
    try {
      await switchRolePreset(preset);
      onSuccess();
    } catch (err) {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-railway-darker flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Gradient Rings */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 border border-sky-400/40 flex items-center justify-center text-white mx-auto shadow-2xl shadow-sky-500/20">
            <Train className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider">
            RAIL<span className="text-sky-400">BLOCK</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
            Control Office Application (COA) Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-railway-card border border-railway-border rounded-3xl p-6 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Username / Email</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-railway-surface border border-railway-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none focus:border-sky-500 transition-colors"
                  placeholder="e.g. controller_ndls"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-railway-surface border border-railway-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none focus:border-sky-500 transition-colors"
                  placeholder="Password123!"
                />
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign in to Operational Control'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Roles */}
          <div className="pt-3 border-t border-railway-border/60 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Or 1-Click Demo Evaluation Sign-in:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleQuickPreset(p)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] cursor-pointer ${p.badgeColor}`}
                >
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="text-xs font-bold block">{p.label}</span>
                      <span className="text-[10px] opacity-80">{p.roleDescription}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
