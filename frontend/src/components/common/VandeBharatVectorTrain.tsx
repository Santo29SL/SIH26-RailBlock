import React from 'react';

interface VandeBharatVectorTrainProps {
  className?: string;
  trainNumber?: string;
  trainName?: string;
  speedRating?: string;
  facingDirection?: 'LEFT' | 'RIGHT';
}

export const VandeBharatVectorTrain: React.FC<VandeBharatVectorTrainProps> = ({
  className = '',
  trainNumber = '22435',
  trainName = 'VANDE BHARAT EXPRESS',
  speedRating = '160 KM/H MPS | PRIORITY CLASS 1 | VBE T-18 RAKE',
  facingDirection = 'RIGHT',
}) => {
  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      {/* SVG Exact Train Illustration */}
      <svg
        viewBox="0 0 920 170"
        className="w-full h-auto max-w-4xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dashed Overhead OHE Power Line */}
        <line
          x1="20"
          y1="28"
          x2="900"
          y2="28"
          stroke="#94a3b8"
          strokeWidth="1.2"
          strokeDasharray="8 6"
        />

        {/* Train Wrapper with Direction Support (Flips so nose points forward when driving RIGHT) */}
        <g transform={facingDirection === 'RIGHT' ? 'translate(920, 0) scale(-1, 1)' : undefined}>
          {/* Pantograph reaching OHE Wire */}
          <g id="pantograph" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round">
            <line x1="435" y1="28" x2="475" y2="28" stroke="#475569" strokeWidth="2.5" />
            <path d="M 440,28 L 455,42 L 470,28" fill="none" />
            <path d="M 455,42 L 448,58 L 462,58 Z" fill="none" />
            <line x1="455" y1="58" x2="455" y2="62" strokeWidth="2.5" />
            <rect x="445" y="60" width="20" height="3" fill="#475569" />
          </g>

          {/* Train Main Body Group */}
          <g id="train-body">
            {/* Driving Aerodynamic Nose + Coach 1 + Coach 2 + Coach 3 */}
            <path
              d="M 80,105 
                 C 65,103 55,90 60,82
                 C 65,70 85,63 125,63
                 L 810,63
                 C 815,63 818,65 818,70
                 L 818,105
                 Z"
              fill="#f8fafc"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Distinctive Vande Bharat Blue Roof & Nose Curve Band */}
            <path
              d="M 60,82
                 C 65,70 85,63 125,63
                 L 810,63
                 C 815,63 818,65 818,70
                 L 818,76
                 L 135,76
                 C 95,76 72,82 60,82
                 Z"
              fill="#2575b8"
              stroke="#1d4ed8"
              strokeWidth="0.8"
            />

            {/* Aerodynamic Cockpit Windshield Glass */}
            <path
              d="M 76,82
                 L 120,68
                 L 142,68
                 L 136,82
                 Z"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="1"
            />
            {/* Headlight circular lens on nose tip */}
            <circle cx="63" cy="88" r="2.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />

            {/* Lower Skirt Panel (Grey) */}
            <path
              d="M 78,100 L 818,100 L 818,105 L 80,105 Z"
              fill="#e2e8f0"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />

            {/* Coach Divider Seams */}
            <line x1="330" y1="63" x2="330" y2="105" stroke="#64748b" strokeWidth="1.2" />
            <line x1="333" y1="63" x2="333" y2="105" stroke="#94a3b8" strokeWidth="0.8" />

            <line x1="575" y1="63" x2="575" y2="105" stroke="#64748b" strokeWidth="1.2" />
            <line x1="578" y1="63" x2="578" y2="105" stroke="#94a3b8" strokeWidth="0.8" />

            {/* Passenger Windows Array - Coach 1 */}
            {Array.from({ length: 8 }).map((_, i) => (
              <rect
                key={`w1-${i}`}
                x={150 + i * 21}
                y={79}
                width={16}
                height={14}
                rx={1}
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth="0.6"
              />
            ))}

            {/* Passenger Windows Array - Coach 2 */}
            {Array.from({ length: 10 }).map((_, i) => (
              <rect
                key={`w2-${i}`}
                x={345 + i * 21}
                y={79}
                width={16}
                height={14}
                rx={1}
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth="0.6"
              />
            ))}

            {/* Passenger Windows Array - Coach 3 */}
            {Array.from({ length: 10 }).map((_, i) => (
              <rect
                key={`w3-${i}`}
                x={590 + i * 21}
                y={79}
                width={16}
                height={14}
                rx={1}
                fill="#1e293b"
                stroke="#0f172a"
                strokeWidth="0.6"
              />
            ))}

            {/* Thin horizontal accent pinstripes */}
            <line x1="140" y1="96" x2="818" y2="96" stroke="#94a3b8" strokeWidth="0.6" />
          </g>

          {/* Undercarriage Bogies & Wheels (⊕ crosshair design) */}
          <g id="wheels">
            {/* Bogie 1 (Front) */}
            <g transform="translate(120, 114)">
              <circle cx="0" cy="0" r="6" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
              <line x1="-6" y1="0" x2="6" y2="0" stroke="#64748b" strokeWidth="0.8" />
              <line x1="0" y1="-6" x2="0" y2="6" stroke="#64748b" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.5" fill="#334155" />

              <circle cx="24" cy="0" r="6" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
              <line x1="18" y1="0" x2="30" y2="0" stroke="#64748b" strokeWidth="0.8" />
              <line x1="24" y1="-6" x2="24" y2="6" stroke="#64748b" strokeWidth="0.8" />
              <circle cx="24" cy="0" r="1.5" fill="#334155" />
            </g>

            {/* Bogie 2 (Middle Left) */}
            <g transform="translate(290, 114)">
              <circle cx="0" cy="0" r="6" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
              <line x1="-6" y1="0" x2="6" y2="0" stroke="#64748b" strokeWidth="0.8" />
              <line x1="0" y1="-6" x2="0" y2="6" stroke="#64748b" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.5" fill="#334155" />

              <circle cx="24" cy="0" r="6" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
              <line x1="18" y1="0" x2="30" y2="0" stroke="#64748b" strokeWidth="0.8" />
              <line x1="24" y1="-6" x2="24" y2="6" stroke="#64748b" strokeWidth="0.8" />
              <circle cx="24" cy="0" r="1.5" fill="#334155" />
            </g>

            {/* Bogie 3 (Middle Right) */}
            <g transform="translate(530, 114)">
              <circle cx="0" cy="0" r="6" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
              <line x1="-6" y1="0" x2="6" y2="0" stroke="#64748b" strokeWidth="0.8" />
              <line x1="0" y1="-6" x2="0" y2="6" stroke="#64748b" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.5" fill="#334155" />

              <circle cx="24" cy="0" r="6" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
              <line x1="18" y1="0" x2="30" y2="0" stroke="#64748b" strokeWidth="0.8" />
              <line x1="24" y1="-6" x2="24" y2="6" stroke="#64748b" strokeWidth="0.8" />
              <circle cx="24" cy="0" r="1.5" fill="#334155" />
            </g>

            {/* Bogie 4 (Rear) */}
            <g transform="translate(750, 114)">
              <circle cx="0" cy="0" r="6" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
              <line x1="-6" y1="0" x2="6" y2="0" stroke="#64748b" strokeWidth="0.8" />
              <line x1="0" y1="-6" x2="0" y2="6" stroke="#64748b" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.5" fill="#334155" />

              <circle cx="24" cy="0" r="6" fill="#f8fafc" stroke="#475569" strokeWidth="1.2" />
              <line x1="18" y1="0" x2="30" y2="0" stroke="#64748b" strokeWidth="0.8" />
              <line x1="24" y1="-6" x2="24" y2="6" stroke="#64748b" strokeWidth="0.8" />
              <circle cx="24" cy="0" r="1.5" fill="#334155" />
            </g>
          </g>

          {/* Steel Rail Line Ground Track */}
          <line
            x1="20"
            y1="120"
            x2="900"
            y2="120"
            stroke="#64748b"
            strokeWidth="1.8"
          />
        </g>

        {/* Centered Train Label Typography (Always readable left-to-right) */}
        <text
          x="340"
          y="148"
          fill="#334155"
          fontFamily="ui-monospace, monospace"
          fontWeight="bold"
          fontSize="12"
          letterSpacing="1.5"
        >
          {trainNumber} - {trainName}
        </text>

        {/* Subtext Specs Typography */}
        <text
          x="540"
          y="148"
          fill="#64748b"
          fontFamily="ui-monospace, monospace"
          fontSize="8.5"
          letterSpacing="0.8"
        >
          {speedRating}
        </text>
      </svg>
    </div>
  );
};
