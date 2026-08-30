import React, { useState, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Train, Gauge, Compass, Clock, UserCheck } from 'lucide-react';

interface AnimatedTrain {
  id: string;
  trainNumber: string;
  trainName: string;
  type: 'VIP' | 'EXPRESS' | 'FREIGHT';
  speedKmh: number;
  direction: 'UP' | 'DOWN';
  status: 'ON_TIME' | 'DELAYED_15M' | 'REGULATED';
  pilotName: string;
  nextStation: string;
  etaNextStation: string;
  currentKm: number;
  lat: number;
  lng: number;
}

export const createAnimatedTrainIcon = (train: AnimatedTrain) => {
  const isVip = train.type === 'VIP';
  const isFreight = train.type === 'FREIGHT';
  const isDown = train.direction === 'DOWN';

  let badgeColor = 'bg-blue-600 text-white';
  let ringColor = 'border-white';
  let directionArrow = isDown ? '→' : '←';
  let emoji = isVip ? '🚄' : isFreight ? '🚂' : '🚆';

  if (isVip) {
    badgeColor = 'bg-rose-600 text-white';
  } else if (isFreight) {
    badgeColor = 'bg-slate-800 text-amber-300';
  }

  const html = `
    <div class="flex items-center justify-center cursor-pointer select-none">
      <div class="flex items-center space-x-1 px-2 py-0.5 rounded-full ${badgeColor} border-2 ${ringColor} shadow-md hover:scale-110 transition-transform">
        <span class="text-[10px]">${emoji}</span>
        <span class="text-[9px] font-mono font-bold">#${train.trainNumber}</span>
        <span class="text-[8px] opacity-80">${directionArrow}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-train-pin',
    iconSize: [80, 24],
    iconAnchor: [40, 12],
    popupAnchor: [0, -14],
  });
};

interface AnimatedTrainLayerProps {
  simulationSpeedMultiplier?: number;
}

export const AnimatedTrainLayer: React.FC<AnimatedTrainLayerProps> = ({
  simulationSpeedMultiplier = 1,
}) => {
  // Spaced out along the 68.8 km corridor so they don't cluster on load
  const [trains, setTrains] = useState<AnimatedTrain[]>([
    {
      id: 'train-vb',
      trainNumber: '20607',
      trainName: 'Vande Bharat Express',
      type: 'VIP',
      speedKmh: 130,
      direction: 'DOWN',
      status: 'ON_TIME',
      pilotName: 'S. Rajagopalan',
      nextStation: 'Arakkonam (AJJ)',
      etaNextStation: '03:42 IST',
      currentKm: 12.0, // Near Perambur / Villivakkam
      lat: 13.109,
      lng: 80.220,
    },
    {
      id: 'train-boxn',
      trainNumber: 'BOXN-88',
      trainName: 'Freight Goods Rake',
      type: 'FREIGHT',
      speedKmh: 65,
      direction: 'DOWN',
      status: 'REGULATED',
      pilotName: 'M. Selvam',
      nextStation: 'Tiruvallur (TRL)',
      etaNextStation: '04:15 IST',
      currentKm: 34.0, // Near Avadi / Tiruvallur
      lat: 13.128,
      lng: 80.020,
    },
    {
      id: 'train-tn',
      trainNumber: '12621',
      trainName: 'Tamil Nadu Superfast',
      type: 'EXPRESS',
      speedKmh: 110,
      direction: 'UP',
      status: 'ON_TIME',
      pilotName: 'K. Ramachandran',
      nextStation: 'Chennai Central (MAS)',
      etaNextStation: '03:50 IST',
      currentKm: 56.0, // Near Arakkonam
      lat: 13.100,
      lng: 79.780,
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrains((prevTrains) =>
        prevTrains.map((train) => {
          const isDown = train.direction === 'DOWN';
          const speedStep = (train.speedKmh / 3600) * 2 * simulationSpeedMultiplier;

          let newKm = isDown ? train.currentKm + speedStep : train.currentKm - speedStep;
          if (newKm > 68.8) newKm = 0.0;
          if (newKm < 0.0) newKm = 68.8;

          const progress = Math.min(1, Math.max(0, newKm / 68.8));
          const lat = 13.0827 + progress * (13.0788 - 13.0827) + (isDown ? 0.002 : -0.002);
          const lng = 80.2707 + progress * (79.6685 - 80.2707);

          return {
            ...train,
            currentKm: newKm,
            lat,
            lng,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [simulationSpeedMultiplier]);

  return (
    <>
      {trains.map((train) => (
        <Marker
          key={train.id}
          position={[train.lat, train.lng]}
          icon={createAnimatedTrainIcon(train)}
        >
          <Popup>
            <div className="p-2 text-xs text-slate-800 space-y-1.5 min-w-[200px]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="font-bold text-blue-600">#{train.trainNumber} {train.trainName}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-bold">{train.direction}</span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div>Speed: <strong>{train.speedKmh} km/h</strong> (KM {train.currentKm.toFixed(1)})</div>
                <div>Next: <strong>{train.nextStation}</strong> (ETA {train.etaNextStation})</div>
                <div>Driver: {train.pilotName}</div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};
