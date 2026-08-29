import React, { useState, useEffect } from 'react';
import { Train, Clock, ShieldCheck, Play, Calendar } from 'lucide-react';

interface HeaderProps {
  onRunOptimizer: (horizonDays: number) => void;
  isOptimizing: boolean;
  activeSection: string;
  onSectionChange: (sec: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRunOptimizer,
  isOptimizing,
  activeSection,
  onSectionChange,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [horizon, setHorizon] = useState<number>(1);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-GB') + ' IST');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header style={{ background: '#003366', color: '#ffffff', borderBottom: '3px solid #f37021' }}>
      {/* Top Government Banner */}
      <div style={{ background: '#002244', padding: '3px 12px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #004080' }}>
        <span>GOVERNMENT OF INDIA • MINISTRY OF RAILWAYS (CRIS / RDSO)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={12} color="#f37021" /> {timeStr}
        </span>
      </div>

      {/* Main IRCTC Navigation Bar */}
      <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#f37021', padding: '6px 10px', fontWeight: 900, fontSize: '16px', letterSpacing: '1px' }}>
            RAILBLOCK
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.5px' }}>
              CONTROL OFFICE APPLICATION (COA)
            </div>
            <div style={{ fontSize: '11px', color: '#b0bec5' }}>
              Automatic Block Planning & Multi-Department Corridor Possession System
            </div>
          </div>
        </div>

        {/* Section Selector & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#ffffff', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cccccc' }}>
            <span style={{ color: '#003366', fontSize: '11px', fontWeight: 700 }}>SECTION:</span>
            <select
              value={activeSection}
              onChange={(e) => onSectionChange(e.target.value)}
              style={{ background: '#ffffff', color: '#003366', fontWeight: 700, border: 'none', outline: 'none', cursor: 'pointer', fontSize: '12px' }}
            >
              <option value="ALL">ALL SECTIONS (MAS-AJJ CORRIDOR)</option>
              <option value="PER-TRL">PER-TRL (Perambur - Tiruvallur)</option>
              <option value="TRL-AJJ">TRL-AJJ (Tiruvallur - Arakkonam)</option>
              <option value="MAS-PER">MAS-PER (Chennai Central - Perambur)</option>
            </select>
          </div>

          <div style={{ background: '#ffffff', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cccccc' }}>
            <Calendar size={13} color="#003366" />
            <span style={{ color: '#003366', fontSize: '11px', fontWeight: 700 }}>HORIZON:</span>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              style={{ background: '#ffffff', color: '#003366', fontWeight: 700, border: 'none', outline: 'none', cursor: 'pointer', fontSize: '12px' }}
            >
              <option value={1}>24-HOUR DAILY</option>
              <option value={7}>7-DAY WEEKLY</option>
              <option value={30}>30-DAY MONTHLY</option>
            </select>
          </div>

          <button
            className="ir-btn ir-btn-primary"
            onClick={() => onRunOptimizer(horizon)}
            disabled={isOptimizing}
            style={{ opacity: isOptimizing ? 0.7 : 1 }}
          >
            <Play size={13} fill="#ffffff" />
            {isOptimizing ? 'SOLVING CP-SAT...' : 'SOLVE SCHEDULE'}
          </button>

          <div style={{ background: '#002244', padding: '4px 8px', border: '1px solid #004d99', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <ShieldCheck size={13} color="#4caf50" />
            <span>ROLE: <strong>CHIEF CONTROLLER (CPRC)</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
