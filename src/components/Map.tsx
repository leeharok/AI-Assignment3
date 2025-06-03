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
    zoom: 13
  });
  const [path, setPath] = useState<Location[]>([]);
  const [murmurDensities, setMurmurDensities] = useState<MurmurDensity[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [nickname, setNickname] = useState<string>('');

  // 닉네임 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('user_nickname');
    if (saved) setNickname(saved);
  }, []);

  // 자정에 경로 리셋
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

  // 위치 주기적 기록
  useEffect(() => {
    if (!isTracking) return;

    const trackLocation = async () => {
      if (!("geolocation" in navigator)) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { longitude, latitude } = pos.coords;
          setUserLocation([longitude, latitude]);
          const timestamp = Date.now();
          const geohash = createGeohash(latitude, longitude);

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
            console.error('위치 저장 실패:', err);
          }
        },
        (err) => {
          console.error('위치 추적 실패:', err);
        }
      );
    };

    trackLocation();
    const intervalId = setInterval(trackLocation, FOOTPRINT_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isTracking]);

  // 버튼 클릭 → 위치 추적 시작
  const handleImprint = () => {
    if (!("geolocation" in navigator)) {
      setLocationError("이 브라우저는 위치 정보를 지원하지 않아요.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude, latitude } = pos.coords;
        setUserLocation([longitude, latitude]);
        setViewState({ longitude, latitude, zoom: 15 });
        setLocationError(null);
        setIsTracking(true);

        const timestamp = Date.now();
        const geohash = createGeohash(latitude, longitude);

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
          console.error('위치 저장 실패:', err);
        }
      },
      (err) => {
        setLocationError("위치 정보를 가져오는 데 실패했어요.");
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
        interactive={false}
      >
        {path.map((point, index) => {
          const style = getFootprintStyle(point.timestamp);
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
                  transition: 'all 0.3s ease'
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
              <div className="w-8 h-8 bg-blue-600 rounded-full shadow-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
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
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
