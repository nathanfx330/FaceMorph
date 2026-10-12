// src/geography.ts
export type GeoPoint = Readonly<{ longitude: number; latitude: number }>;
export type Axes = Readonly<{ eastWest: number; northSouth: number }>;

export const EUROPE_BOUNDS = Object.freeze({
  minLongitude: -13,
  maxLongitude: 55,
  minLatitude: 35,
  maxLatitude: 72,
});

export const INITIAL_POINT: GeoPoint = Object.freeze({
  longitude: 13,
  latitude: 52,
});

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function clampGeo(point: GeoPoint): GeoPoint {
  return {
    longitude: clamp(point.longitude, EUROPE_BOUNDS.minLongitude, EUROPE_BOUNDS.maxLongitude),
    latitude: clamp(point.latitude, EUROPE_BOUNDS.minLatitude, EUROPE_BOUNDS.maxLatitude),
  };
}

export function pointToAxes(point: GeoPoint): Axes {
  const p = clampGeo(point);
  const { minLongitude, maxLongitude, minLatitude, maxLatitude } = EUROPE_BOUNDS;
  return {
    eastWest: (2 * (p.longitude - minLongitude)) / (maxLongitude - minLongitude) - 1,
    northSouth: (2 * (p.latitude - minLatitude)) / (maxLatitude - minLatitude) - 1,
  };
}

export function axesToPoint(axes: Axes): GeoPoint {
  const { minLongitude, maxLongitude, minLatitude, maxLatitude } = EUROPE_BOUNDS;
  return {
    longitude: minLongitude + ((clamp(axes.eastWest, -1, 1) + 1) / 2) * (maxLongitude - minLongitude),
    latitude: minLatitude + ((clamp(axes.northSouth, -1, 1) + 1) / 2) * (maxLatitude - minLatitude),
  };
}

// Synthetic shape-key weights. These have NO empirical population interpretation.
export function illustrativeWeights(axes: Axes): [number, number, number, number] {
  const x = clamp(axes.eastWest, -1, 1);
  const y = clamp(axes.northSouth, -1, 1);
  return [Math.max(0, x), Math.max(0, -x), Math.max(0, y), Math.max(0, -y)];
}

export function formatCoordinate(value: number, axis: 'latitude' | 'longitude'): string {
  const direction = axis === 'latitude'
    ? (value >= 0 ? 'N' : 'S')
    : (value >= 0 ? 'E' : 'W');
  return Math.abs(value).toFixed(1) + '° ' + direction;
}
