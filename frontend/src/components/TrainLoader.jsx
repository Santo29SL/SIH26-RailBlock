import React from 'react';

const TrainLoader = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* The Train Track Area */}
      <div className="w-full relative h-32 border-b-4 border-gray-700 border-dashed flex items-end pb-1">
        
        {/* The Moving Train */}
        <div className="absolute left-0 animate-drive flex items-center text-6xl drop-shadow-lg">
          🚂 
          <span className="text-4xl ml-2 animate-steam">💨</span>
          <span className="text-3xl ml-1 animate-steam" style={{ animationDelay: '0.2s' }}>💨</span>
        </div>
        
      </div>

      {/* Loading Text */}
      <div className="mt-8 flex flex-col items-center">
        <h2 className="text-railway-accent text-xl font-bold font-mono tracking-widest uppercase animate-pulse">
          Calculating Block Schedule
        </h2>
        <p className="text-gray-400 mt-2 text-sm">
          Optimizing train movements and infrastructure data...
        </p>
      </div>
    </div>
  );
};

export default TrainLoader;