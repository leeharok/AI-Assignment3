'use client';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-gray-100 rounded-lg animate-pulse" />
});

export default function MapContainer() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Explore Nearby</h2>
      <MapComponent />
    </div>
  );
} 