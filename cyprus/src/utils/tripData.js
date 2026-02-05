import LZString from 'lz-string';

/**
 * Encodes trip data into a compressed URL-safe string
 */
export function encodeTripData(tripData) {
    try {
        const json = JSON.stringify(tripData);
        const compressed = LZString.compressToEncodedURIComponent(json);
        return compressed;
    } catch (error) {
        console.error('Error encoding trip data:', error);
        return null;
    }
}

/**
 * Decodes trip data from a compressed URL string
 */
export function decodeTripData(encoded) {
    try {
        const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
        if (!decompressed) return null;
        return JSON.parse(decompressed);
    } catch (error) {
        console.error('Error decoding trip data:', error);
        return null;
    }
}

/**
 * Gets trip data from URL hash or source URL
 */
export function getTripFromURL() {
    const hash = window.location.hash;
    if (!hash) return null;

    // Check for encoded trip data
    if (hash.includes('trip=')) {
        const match = hash.match(/trip=([^&]+)/);
        if (match) return decodeTripData(match[1]);
    }

    return null;
}

/**
 * Gets source URL from hash if present
 */
export function getSourceFromURL() {
    const hash = window.location.hash;
    if (!hash) return null;

    // Support #source=URL
    if (hash.includes('source=')) {
        const match = hash.match(/source=([^&]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }

    // Support simplified links (e.g. #puglia)
    if (hash && !hash.includes('=') && !hash.includes('view=') && hash.length > 1) {
        const path = hash.substring(1); // remove #
        // If it contains a dot, it might have an extension already or be an external URL
        if (path.includes('.')) {
            if (path.endsWith('.json')) {
                return path.includes('/') ? path : `itineraries/${path}`;
            }
            return null; // Don't match other extensions
        }
        // No dot, assume it's a name in itineraries/
        return `itineraries/${path}.json`;
    }

    return null;
}

/**
 * Checks if view-only mode is enabled in URL
 */
export function isViewOnlyFromURL() {
    return window.location.hash.includes('view=1') || window.location.search.includes('view=1');
}

/**
 * Updates URL with trip data
 */
export function updateURLWithTrip(tripData) {
    const encoded = encodeTripData(tripData);
    if (!encoded) return false;

    window.history.pushState(null, '', `#trip=${encoded}`);
    return true;
}

/**
 * Saves trip to localStorage (backup)
 */
export function saveTripToLocalStorage(tripData) {
    try {
        localStorage.setItem('current-trip', JSON.stringify(tripData));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

/**
 * Loads trip from localStorage
 */
export function loadTripFromLocalStorage() {
    try {
        const data = localStorage.getItem('current-trip');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return null;
    }
}

/**
 * Clears localStorage backup
 */
export function clearLocalStorageTrip() {
    try {
        localStorage.removeItem('current-trip');
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
}

/**
 * Generates a shareable URL
 */
export function generateShareURL(tripData, options = {}) {
    const baseURL = window.location.origin + window.location.pathname;
    let url = baseURL;

    if (options.source) {
        // If the source is in itineraries/, we use the simplified format (without .json)
        if (options.source.startsWith('itineraries/') && options.source.endsWith('.json') && !options.source.substring(12).includes('/')) {
            url += `#${options.source.substring(12, options.source.length - 5)}`;
        } else {
            url += `#source=${encodeURIComponent(options.source)}`;
        }
    } else {
        const encoded = encodeTripData(tripData);
        if (!encoded) return null;
        url += `#trip=${encoded}`;
    }

    if (options.viewOnly) {
        url += `${url.includes('#') ? '&' : '#'}view=1`;
    }

    return url;
}

/**
 * Validates trip data structure
 */
export function validateTripData(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: "Invalid JSON object." };
    }
    
    // Check tripConfig
    if (!data.tripConfig || typeof data.tripConfig !== 'object') {
        return { valid: false, error: "Missing or invalid 'tripConfig' object." };
    }
    
    // Check days
    if (!data.days || !Array.isArray(data.days)) {
        return { valid: false, error: "Missing or invalid 'days' array." };
    }

    // Optional but should be array if present
    if (data.flights && !Array.isArray(data.flights)) {
        return { valid: false, error: "'flights' must be an array." };
    }

    if (data.palette && typeof data.palette !== 'object') {
        return { valid: false, error: "'palette' must be an object." };
    }
    
    return { valid: true };
}
