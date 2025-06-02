'use client';

import { useState, useEffect, useCallback } from 'react';
import { Map as MapLibre, Marker, Source, Layer } from 'react-map-gl/maplibre';
import { saveLocation, getMurmurDensity, LocationData } from '@/lib/supabase';
import { createGeohash } from '@/lib/geohash';

interface Location {
  longitude: number;
  latitude: number;
  timestamp: number;
}

interface MurmurDensity {
  geohash: string;
  count: number;
}

interface Place {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
}

const FOOTPRINT_INTERVAL = 15 * 60 * 1000; // 15분
const FOOTPRINT_DURATION = 24 * 60 * 60 * 1000; // 24시간

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
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [nickname, setNickname] = useState<string>('');

  // 닉네임 로드
  useEffect(() => {
    const savedNickname = localStorage.getItem('user_nickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }
  }, []);

  // 자정에 경로 리셋
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const resetTimer = setTimeout(() => {
      setPath([]);
      setIsTracking(false);
    }, timeUntilMidnight);

    return () => clearTimeout(resetTimer);
  }, []);

  // 15분 주기로 위치 기록
  useEffect(() => {
    if (!isTracking) return;

    const trackLocation = async () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { longitude, latitude } = position.coords;
            setUserLocation([longitude, latitude]);
            
            // 위치 데이터 저장
            const timestamp = new Date().toISOString();
            const geohash = createGeohash(latitude, longitude);
            
            try {
              await saveLocation({
                user_id: 'temp-user-id', // TODO: 실제 사용자 ID로 대체
                longitude,
                latitude,
                timestamp,
                geohash
              });

              // murmur 밀도 조회
              const density = await getMurmurDensity(geohash);
              if (density && density.length > 0) {
                setMurmurDensities([{
                  geohash,
                  count: density[0].count
                }]);
              }

              setPath(prev => [...prev, {
                longitude,
                latitude,
                timestamp: Date.now()
              }]);
            } catch (error) {
              console.error('위치 데이터 저장 실패:', error);
            }
          },
          (error) => {
            console.error('위치 추적 실패:', error);
          }
        );
      }
    };

    // 초기 위치 기록
    trackLocation();

    // 15분 주기로 위치 기록
    const intervalId = setInterval(trackLocation, FOOTPRINT_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isTracking]);

  // 위치 추적 시작
  const startTracking = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);
          setViewState({
            longitude,
            latitude,
            zoom: 15
          });
          setLocationError(null);
          setIsTracking(true);
          
          // 첫 위치 기록
          const timestamp = new Date().toISOString();
          const geohash = createGeohash(latitude, longitude);
          
          try {
            await saveLocation({
              user_id: 'temp-user-id', // TODO: 실제 사용자 ID로 대체
              longitude,
              latitude,
              timestamp,
              geohash
            });

            // murmur 밀도 조회
            const density = await getMurmurDensity(geohash);
            if (density && density.length > 0) {
              setMurmurDensities([{
                geohash,
                count: density[0].count
              }]);
            }

            setPath([{
              longitude,
              latitude,
              timestamp: Date.now()
            }]);
          } catch (error) {
            console.error('위치 데이터 저장 실패:', error);
          }
        },
        (error) => {
          setLocationError("위치 정보를 가져오는데 실패했습니다.");
        }
      );
    } else {
      setLocationError("이 브라우저는 위치 정보를 지원하지 않습니다.");
    }
  };

  // 발자취 스타일 계산
  const getFootprintStyle = (timestamp: number) => {
    const age = Date.now() - timestamp;
    const hours = age / (1000 * 60 * 60);
    
    return {
      size: Math.max(4, 12 - hours * 2),
      color: `rgba(59, 130, 246, ${Math.max(0.1, 1 - hours / 12)})`
    };
  };

  // 경로 데이터를 GeoJSON으로 변환
  const pathGeoJson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: path.map(point => [point.longitude, point.latitude])
    }
  };

  const searchNearbyPlaces = async (longitude: number, latitude: number) => {
    try {
      // TODO: 실제 API 연동
      // 임시 데이터
      const mockPlaces: Place[] = [
        {
          id: '1',
          name: '스타벅스 강남점',
          longitude: longitude + 0.001,
          latitude: latitude + 0.001
        },
        {
          id: '2',
          name: '맥도날드 강남점',
          longitude: longitude - 0.001,
          latitude: latitude - 0.001
        }
      ];
      setNearbyPlaces(mockPlaces);
    } catch (error) {
      console.error('주변 장소 검색 실패:', error);
    }
  };

  // IMPRINT MY MURMUR 버튼 클릭 핸들러
  const handleImprint = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setUserLocation(location);
      setViewState(prev => ({
        ...prev,
        longitude: location[0],
        latitude: location[1]
      }));

      const saved = await saveCurrentLocation(location);
      if (saved) {
        setPath(prev => [...prev, {
          longitude: location[0],
          latitude: location[1],
          timestamp: Date.now()
        }]);
      }
    }
  };

  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return null;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { longitude, latitude } = position.coords;
      return [longitude, latitude] as [number, number];
    } catch (error) {
      setLocationError('Unable to retrieve your location');
      return null;
    }
  }, []);

  // 위치 저장 및 murmur density 가져오기
  const saveCurrentLocation = useCallback(async (location: [number, number]) => {
    try {
      const geohash = createGeohash(location[1], location[0]);
      const timestamp = Date.now();
      
      await saveLocation({
        longitude: location[0],
        latitude: location[1],
        geohash,
        timestamp,
        user_id: '' // This will be set by the backend
      });

      const density = await getMurmurDensity(geohash);
      setMurmurDensities(prev => {
        const filtered = prev.filter(d => d.geohash !== geohash);
        return [...filtered, { geohash, count: density }];
      });

      return true;
    } catch (error) {
      console.error('Error saving location:', error);
      return false;
    }
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <MapLibre
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        interactive={false}
      >
        {/* 발자취 표시 */}
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

        {/* 현재 위치 마커 */}
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

        {/* Murmur Density 표시 */}
        {murmurDensities.map((density, index) => (
          <Marker
            key={index}
            longitude={parseFloat(density.geohash)}
            latitude={parseFloat(density.geohash)}
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

      {/* IMPRINT MY MURMUR 버튼 */}
      <button
        onClick={handleImprint}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors font-bold z-10"
      >
        IMPRINT MY MURMUR
      </button>

      {locationError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded shadow z-10">
          {locationError}
        </div>
      )}

      {selectedPlace && (
        <div className="absolute bottom-20 left-4 right-4 bg-white p-4 rounded-lg shadow-lg z-10">
          <h3 className="text-lg font-bold mb-2">{selectedPlace.name}</h3>
          <button
            onClick={() => setSelectedPlace(null)}
            className="absolute top-2 right-2 text-xl cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
} 