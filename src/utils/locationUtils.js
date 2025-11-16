/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Parse location string "lat,lng" to coordinates
 * @param {string} locationString - Location string in format "lat,lng"
 * @returns {{lat: number, lng: number} | null}
 */
export const parseLocationString = (locationString) => {
  if (!locationString || typeof locationString !== 'string') return null;
  const parts = locationString.split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
};

/**
 * Check if a clock-in location is within the shift's radius
 * @param {string} clockinLocation - Clock-in location string "lat,lng"
 * @param {number} shiftLatitude - Shift latitude
 * @param {number} shiftLongitude - Shift longitude
 * @param {number} radiusMeters - Allowed radius in meters
 * @returns {boolean} True if within radius
 */
export const isWithinShiftRadius = (clockinLocation, shiftLatitude, shiftLongitude, radiusMeters) => {
  if (!clockinLocation || !shiftLatitude || !shiftLongitude || radiusMeters === undefined) {
    return false;
  }

  const clockinCoords = parseLocationString(clockinLocation);
  if (!clockinCoords) return false;

  // Special case: if coordinates match exactly (or very close, within 1 meter), it's definitely office
  const latDiff = Math.abs(clockinCoords.lat - shiftLatitude);
  const lngDiff = Math.abs(clockinCoords.lng - shiftLongitude);
  if (latDiff < 0.00001 && lngDiff < 0.00001) {
    // Coordinates are essentially the same (within ~1 meter)
    return true;
  }

  const distance = calculateDistance(
    clockinCoords.lat,
    clockinCoords.lng,
    shiftLatitude,
    shiftLongitude
  );

  return distance <= radiusMeters;
};

/**
 * Extract latitude and longitude from Google Maps URL
 * @param {string} url - Google Maps URL
 * @returns {{lat: number, lng: number} | null}
 */
export const extractLatLngFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  // Try to extract from different URL formats
  // Format 1: https://www.google.com/maps?q=lat,lng
  const qMatch = url.match(/[?&]q=([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // Format 2: https://www.google.com/maps/@lat,lng,zoom
  const atMatch = url.match(/@([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // Format 3: https://maps.google.com/maps?ll=lat,lng
  const llMatch = url.match(/[?&]ll=([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
  if (llMatch) {
    const lat = parseFloat(llMatch[1]);
    const lng = parseFloat(llMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  return null;
};
