import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, DemoUserPreset } from '../types/auth';
import { authApi } from '../api/auth';

export const DEMO_PRESETS: DemoUserPreset[] = [
  {
    username: 'controller_ndls',
    label: 'Chief / Section Controller (CPRC)',
    role: 'SECTION_CONTROLLER',
    roleDescription: 'Optimizer runs, What-If simulation, schedule commit, fast rescheduler',
    department: 'OPERATIONS',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  {
    username: 'station_master_cnb',
    label: 'Station Master (MAS / Central)',
    role: 'STATION_MASTER',
    roleDescription: 'Form T/351 Disconnection Private Numbers (PN) & Form T/D 602 SLW authority',
    department: 'OPERATIONS',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    username: 'pwi_engineer',
    label: 'Track Engineer (SSE / Permanent Way)',
    role: 'DEPARTMENT_ENGINEER',
    roleDescription: 'Track defect inspections, TMS ingestion, departmental consent sign-offs',
    department: 'TRACK',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  },
  {
    username: 'drm_mas',
    label: 'Divisional Authority (DRM / Sr.DOM)',
    role: 'DIVISIONAL_AUTHORITY',
    roleDescription: 'Sanctions for major traffic blocks > 4 hours & NI works > 3 days',
    department: 'OPERATIONS',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  {
    username: 'admin',
    label: 'System Administrator (CRIS)',
    role: 'ADMIN',
    roleDescription: 'Full system configuration, section creation & user management',
    department: 'SYSTEM',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
];

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  switchRolePreset: (preset: DemoUserPreset) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const defaultPreset = DEMO_PRESETS[0];
    return {
      id: 'demo-controller-id',
      username: defaultPreset.username,
      email: `${defaultPreset.username}@railblock.gov.in`,
      role: defaultPreset.role,
      department: defaultPreset.department,
      is_active: true,
    };
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('railblock_token'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (username: string, password = 'Password123!') => {
    setIsLoading(true);
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('railblock_token', res.access_token);
      setToken(res.access_token);
      const profile = await authApi.getCurrentUser();
      setUser(profile);
    } catch (e) {
      const preset = DEMO_PRESETS.find((p) => p.username === username) || DEMO_PRESETS[0];
      setUser({
        id: `mock-${preset.username}`,
        username: preset.username,
        email: `${preset.username}@railblock.gov.in`,
        role: preset.role,
        department: preset.department,
        is_active: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Instant synchronous role switching
  const switchRolePreset = (preset: DemoUserPreset) => {
    setUser({
      id: `user-${preset.username}`,
      username: preset.username,
      email: `${preset.username}@railblock.gov.in`,
      role: preset.role,
      department: preset.department,
      is_active: true,
    });
  };

  const logout = () => {
    localStorage.removeItem('railblock_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        switchRolePreset,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
