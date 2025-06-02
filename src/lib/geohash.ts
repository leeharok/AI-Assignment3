// geohash 생성 함수
export function createGeohash(latitude: number, longitude: number, precision: number = 6): string {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let idx = 0;
  let bit = 0;
  let ch = 0;
  let geohash = '';

  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;

  while (geohash.length < precision) {
    if (bit % 2 === 0) {
      const lonMid = (lonMin + lonMax) / 2;
      if (longitude > lonMid) {
        ch = (ch << 1) + 1;
        lonMin = lonMid;
      } else {
        ch = (ch << 1) + 0;
        lonMax = lonMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (latitude > latMid) {
        ch = (ch << 1) + 1;
        latMin = latMid;
      } else {
        ch = (ch << 1) + 0;
        latMax = latMid;
      }
    }

    bit++;
    if (bit === 5) {
      geohash += base32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

// geohash로부터 위도/경도 범위 계산
export function decodeGeohash(geohash: string): { lat: [number, number]; lon: [number, number] } {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;

  for (let i = 0; i < geohash.length; i++) {
    const ch = geohash[i];
    const idx = base32.indexOf(ch);
    
    for (let j = 0; j < 5; j++) {
      const bit = (idx >> (4 - j)) & 1;
      if (i % 2 === 0) {
        const lonMid = (lonMin + lonMax) / 2;
        if (bit === 1) {
          lonMin = lonMid;
        } else {
          lonMax = lonMid;
        }
      } else {
        const latMid = (latMin + latMax) / 2;
        if (bit === 1) {
          latMin = latMid;
        } else {
          latMax = latMid;
        }
      }
    }
  }

  return {
    lat: [latMin, latMax],
    lon: [lonMin, lonMax]
  };
} 