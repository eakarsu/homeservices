/**
 * Travel time estimation for dispatch and scheduling.
 *
 * Replaces `15 + Math.floor(Math.random() * 20)` in the dispatch and
 * scheduling fallback paths. A dispatch board showing an invented ETA is worse
 * than no ETA: a customer waits on it and a technician is judged against it.
 *
 * The estimator is a documented haversine calculation over real coordinates at
 * a stated average road speed. When coordinates are not available it returns
 * `null` with a reason rather than a plausible-looking number.
 */

/** Average road speed used when no live traffic feed exists. */
export const AVG_ROAD_SPEED_MPH = 30;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface TravelEstimate {
  /** Minutes; null when the estimate could not be formed. */
  minutes: number | null;
  /** Straight-line distance in miles; null when coordinates were absent. */
  miles: number | null;
  method: 'haversine' | 'unavailable';
  /** Human explanation of how the figure was derived, or why it is null. */
  basis: string;
  /** True when the figure is a real estimate rather than a fallback constant. */
  reliable: boolean;
}

const R_MILES = 3958.8;

export function haversineMiles(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Estimate travel time from `from` to `to`.
 *
 * Straight-line distance is scaled by a road-circuity factor (roads are not
 * straight) before dividing by the average speed. Every assumption is named in
 * the returned `basis` so the dispatch board can display how the ETA was formed.
 */
export function estimateTravelMinutes(
  from: GeoPoint | null | undefined,
  to: GeoPoint | null | undefined,
  opts: { speedMph?: number; circuityFactor?: number } = {},
): TravelEstimate {
  const speed = opts.speedMph ?? AVG_ROAD_SPEED_MPH;
  const circuity = opts.circuityFactor ?? 1.3;

  const hasFrom = !!from && Number.isFinite(from!.latitude) && Number.isFinite(from!.longitude);
  const hasTo = !!to && Number.isFinite(to!.latitude) && Number.isFinite(to!.longitude);

  if (!hasFrom || !hasTo) {
    return {
      minutes: null,
      miles: null,
      method: 'unavailable',
      basis: 'No coordinates for ' + (!hasFrom ? 'origin' : '') + (!hasFrom && !hasTo ? ' or ' : '') + (!hasTo ? 'destination' : '') + '; travel time cannot be estimated without them.',
      reliable: false,
    };
  }

  const miles = haversineMiles(from as GeoPoint, to as GeoPoint);
  const roadMiles = miles * circuity;
  const minutes = Math.max(1, Math.round((roadMiles / speed) * 60));

  return {
    minutes,
    miles: Number(miles.toFixed(2)),
    method: 'haversine',
    basis:
      `Straight-line ${miles.toFixed(2)} mi × circuity ${circuity} = ${roadMiles.toFixed(2)} road mi ` +
      `at ${speed} mph average → ${minutes} min. No live traffic feed is applied.`,
    reliable: true,
  };
}

/**
 * Pull a usable coordinate out of the shapes the app stores (Property address
 * rows, technician location pings, or caller-supplied objects).
 */
export function toGeoPoint(value: unknown): GeoPoint | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const lat = Number(v.latitude ?? v.lat);
  const lon = Number(v.longitude ?? v.lon ?? v.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { latitude: lat, longitude: lon };
}