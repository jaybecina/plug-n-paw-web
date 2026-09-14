const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function haversineKm(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
) {
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lon - from.lon);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function roundDistanceKm(distanceKm: number) {
  return Math.round(distanceKm * 10) / 10;
}

export function roundCoordinate(coordinate: number) {
  return Math.round(coordinate * 1000) / 1000;
}

