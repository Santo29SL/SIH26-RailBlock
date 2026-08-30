import L from 'leaflet';

export const createDefectIcon = (criticalityIndex: number, usfdClassification = 'GOOD') => {
  const isCritical = criticalityIndex > 80 || usfdClassification === 'IMR' || usfdClassification === 'IMRW';
  const isModerate = !isCritical && (criticalityIndex >= 50 || usfdClassification === 'OBS' || usfdClassification === 'OBSW');

  let bgClass = 'bg-emerald-500 border-emerald-300 text-emerald-950';
  let pulseHtml = '';

  if (isCritical) {
    bgClass = 'bg-rose-600 border-rose-300 text-white shadow-lg shadow-rose-600/50';
    pulseHtml = `<div class="absolute -inset-1 rounded-full bg-rose-500 animate-ping opacity-75"></div>`;
  } else if (isModerate) {
    bgClass = 'bg-amber-500 border-amber-300 text-amber-950 shadow-md shadow-amber-500/30';
  }

  const html = `
    <div class="relative flex items-center justify-center w-7 h-7 cursor-pointer group">
      ${pulseHtml}
      <div class="relative w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-[10px] font-mono ${bgClass} transition-transform group-hover:scale-125">
        ${Math.round(criticalityIndex)}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-defect-pin',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

export const createStationIcon = (stationCode: string) => {
  const html = `
    <div class="flex flex-col items-center cursor-pointer group">
      <div class="w-3.5 h-3.5 rounded-full bg-sky-400 border-2 border-white shadow-md shadow-sky-400/50 group-hover:scale-125 transition-transform"></div>
      <span class="mt-1 px-1.5 py-0.2 rounded bg-railway-dark/90 border border-railway-border text-[9px] font-mono font-bold text-sky-300 whitespace-nowrap shadow">
        ${stationCode}
      </span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-station-pin',
    iconSize: [40, 30],
    iconAnchor: [20, 7],
    popupAnchor: [0, -10],
  });
};
