// src/geography.test.ts
import { describe, expect, it } from 'vitest';
import {
  axesToPoint, clampGeo, EUROPE_BOUNDS, illustrativeWeights,
  pointToAxes, formatCoordinate,
} from './geography';

describe('geographic selection', () => {
  it('maps bounds to synthetic axes', () => {
    expect(pointToAxes({
      longitude: EUROPE_BOUNDS.minLongitude,
      latitude: EUROPE_BOUNDS.minLatitude,
    })).toEqual({ eastWest: -1, northSouth: -1 });
    expect(pointToAxes({
      longitude: EUROPE_BOUNDS.maxLongitude,
      latitude: EUROPE_BOUNDS.maxLatitude,
    })).toEqual({ eastWest: 1, northSouth: 1 });
  });

  it('round trips the geographic selection', () => {
    const point = { longitude: 17.2, latitude: 50.5 };
    const restored = axesToPoint(pointToAxes(point));
    expect(restored.longitude).toBeCloseTo(point.longitude);
    expect(restored.latitude).toBeCloseTo(point.latitude);
  });

  it('clamps out-of-range coordinates safely', () => {
    expect(clampGeo({ longitude: -400, latitude: 900 })).toEqual({
      longitude: EUROPE_BOUNDS.minLongitude,
      latitude: EUROPE_BOUNDS.maxLatitude,
    });
  });

  it('clamps bad numeric input', () => {
    expect(pointToAxes({ longitude: Number.NaN, latitude: Infinity })).toEqual({
      eastWest: -1,
      northSouth: -1,
    });
  });

  it('never mixes opposite illustrative targets', () => {
    const [east, west, north, south] = illustrativeWeights({
      eastWest: 0.4, northSouth: -0.8,
    });
    expect([east, west, north, south]).toEqual([0.4, 0, 0, 0.8]);
    expect(east * west + north * south).toBe(0);
  });

  it('formats signed coordinates', () => {
    expect(formatCoordinate(-3.2, 'longitude')).toBe('3.2° W');
    expect(formatCoordinate(52, 'latitude')).toBe('52.0° N');
  });
});
