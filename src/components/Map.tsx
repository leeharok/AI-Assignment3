'use client';

import { useState, useEffect } from 'react';
import { Map as MapLibre, Marker } from 'react-map-gl/maplibre';
import { saveLocation, getMurmurDensity } from '@/lib/supabase';
import { createGeohash } from '@/lib/geohash';

interface Location {
  longitude: number;
  latitude: number;
  timestamp: number;
}

interface MurmurDensity {
  geohash: string;
  count: number;
  longitude: number;
  latitude: number;
}

interface Place {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
}

const FOOTPRINT_INTERVAL = 15 * 60 * 1000; // 15분

function getFootprintStyle(timestamp: number) {
  const age = Date.now() - timestamp;
  const maxAge = 24 * 60 * 60 * 1000; // 24시간
  const opacity = Math.max(0, 1 - age / maxAge);
  if (opacity <= 0) return null; // 너무 희미하면 마커 생략
  return {
    size: 10 + opacity * 10,
    color: `rgba(0, 123, 255, ${opacity})`
  };
}

export default function Map() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 126.9780,
    latitude: 37.5665,
    zoom: 15
  });
  const [path, setPath] = useState<Location[]>([]);
  const [murmurDensities, setMurmurDensities] = useState<MurmurDensity[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [nickname, setNickname] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('user_nickname');
    if (saved) setNickname(saved);
  }, []);

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeout = tomorrow.getTime() - now.getTime();
    const timer = setTimeout(() => {
      setPath([]);
      setIsTracking(false);
    }, timeout);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isTracking) return;

    const trackLocation = async () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { longitude, latitude } = pos.coords;
          const timestamp = Date.now();
          const geohash = createGeohash(latitude, longitude);

          setUserLocation([longitude, latitude]);

          try {
            await saveLocation({
              user_id: 'temp-user-id',
              longitude,
              latitude,
              timestamp,
              geohash
            });

            const density = await getMurmurDensity(geohash);
            if (density?.length > 0) {
              setMurmurDensities([{
                geohash,
                count: density[0].count,
                longitude,
                latitude
              }]);
            }

            setPath(prev => [...prev, { longitude, latitude, timestamp }]);
          } catch (err) {
            console.error('Failed to save location:', err);
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
        }
      );
    };

    trackLocation();
    const intervalId = setInterval(trackLocation, FOOTPRINT_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isTracking]);

  const handleImprint = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude, latitude } = pos.coords;
        const timestamp = Date.now();
        const geohash = createGeohash(latitude, longitude);

        setUserLocation([longitude, latitude]);
        setViewState({ longitude, latitude, zoom: 15 });
        setLocationError(null);
        setIsTracking(true);

        try {
          await saveLocation({
            user_id: 'temp-user-id',
            longitude,
            latitude,
            timestamp,
            geohash
          });

          const density = await getMurmurDensity(geohash);
          if (density?.length > 0) {
            setMurmurDensities([{
              geohash,
              count: density[0].count,
              longitude,
              latitude
            }]);
          }

          setPath([{ longitude, latitude, timestamp }]);
        } catch (err) {
          console.error('Failed to save location:', err);
        }
      },
      (err) => {
        setLocationError("Failed to fetch location.");
      }
    );
  };

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <MapLibre
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        interactive={true}
      >
        {path.map((point, index) => {
          const style = getFootprintStyle(point.timestamp);
          if (!style) return null;

          return (
            <Marker
              key={index}
              longitude={point.longitude}
              latitude={point.latitude}
              anchor="center"
            >
              <div
                style={{
                  width: `${style.size}px`,
                  height: `${style.size}px`,
                  borderRadius: '50%',
                  backgroundColor: style.color,
                  boxShadow: `0 0 ${style.size}px ${style.color}`,
                  transition: 'all 0.3s ease',
                  border: '2px solid white'
                }}
              />
            </Marker>
          );
        })}

        {userLocation && (
          <Marker
            longitude={userLocation[0]}
            latitude={userLocation[1]}
            anchor="center"
          >
            <div className="relative flex flex-col items-center" style={{ transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
              {nickname && (
                <div className="bg-white px-3 py-2 rounded-lg text-sm shadow-lg whitespace-nowrap border border-gray-200 mb-2">
                  <div className="font-bold text-blue-600">{nickname}</div>
                  <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
                </div>
              )}
              <div className="w-10 h-10 bg-blue-600 rounded-full shadow-lg flex items-center justify-center border-2 border-white">
                <div className="w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
          </Marker>
        )}

        {murmurDensities.map((density, index) => (
          <Marker
            key={index}
            longitude={density.longitude}
            latitude={density.latitude}
            anchor="center"
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '2px solid #3B82F6',
                fontWeight: 'bold',
                color: '#1E40AF'
              }}
            >
              {density.count} murmurs
            </div>
          </Marker>
        ))}
      </MapLibre>

      <button
        onClick={handleImprint}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors font-bold z-10 text-lg md:text-base md:py-3"
        aria-label="Leave your murmur at current location"
      >
        IMPRINT MY MURMUR
      </button>

      {locationError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-800 px-4 py-3 rounded shadow z-10 text-base md:text-sm">
          {locationError}
        </div>
      )}

      {selectedPlace && (
        <div className="absolute bottom-20 left-4 right-4 bg-white p-4 rounded-lg shadow-lg z-10">
          <h3 className="text-lg font-bold mb-2 text-gray-900">{selectedPlace.name}</h3>
          <button
            onClick={() => setSelectedPlace(null)}
            className="absolute top-2 right-2 text-xl cursor-pointer text-gray-600 hover:text-gray-900"
            aria-label="Close place details"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
