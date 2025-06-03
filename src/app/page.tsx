'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Auth from '@/components/Auth';
import Map from '@/components/Map';

export default function Home() {
  const { user, loading } = useAuth();
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenGuide');
    if (hasSeenGuide) {
      setShowGuide(false);
    }
  }, []);

  const handleCloseGuide = () => {
    setShowGuide(false);
    localStorage.setItem('hasSeenGuide', 'true');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <main className="relative w-full h-screen">
      {showGuide && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white p-6 rounded-lg shadow-lg z-50 max-w-md w-[90%]">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Welcome to Murmur! 👋</h2>
          <p className="text-gray-600 mb-4">
            Murmur is a location-based social platform where you can:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
            <li>Leave your thoughts on the map</li>
            <li>Discover messages from people around you</li>
            <li>Connect anonymously through shared locations</li>
          </ul>
          <button
            onClick={handleCloseGuide}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      )}
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">IMPRINT</h1>
          <Map />
        </div>
      </div>
    </main>
  );
}
