import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 위치 데이터 타입
export interface LocationData {
  id?: string;
  user_id: string;
  longitude: number;
  latitude: number;
  timestamp: number;
  geohash: string;
  created_at?: string;
}

// murmur 밀도 데이터 타입
export interface MurmurDensity {
  geohash: string;
  count: number;
  timestamp: string;
}

// 위치 데이터 저장
export async function saveLocation(location: Omit<LocationData, 'id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('locations')
    .insert([
      {
        user_id: user.id,
        longitude: location.longitude,
        latitude: location.latitude,
        timestamp: location.timestamp,
        geohash: location.geohash
      }
    ])
    .select();

  if (error) throw error;
  return data;
}

// 특정 geohash의 murmur 밀도 조회
export async function getMurmurDensity(geohash: string): Promise<MurmurDensity[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('geohash, timestamp')
    .eq('geohash', geohash)
    .gte('timestamp', Date.now() - 24 * 60 * 60 * 1000);

  if (error) throw error;
  return data ? [{
    geohash,
    count: data.length,
    timestamp: new Date().toISOString()
  }] : [];
}

// 사용자의 오늘 경로 조회
export async function getUserPath(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', startOfDay.toISOString())
    .lte('timestamp', endOfDay.toISOString())
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data;
}

// 모든 murmur 조회
export async function getMurmurs() {
  const { data, error } = await supabase
    .from('murmurs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
} 