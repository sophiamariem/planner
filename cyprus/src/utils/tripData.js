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
 * Gets trip data from URL hash
 */
export function getTripFromURL() {
    const hash = window.location.hash;
    if (!hash || !hash.includes('trip=')) return null;

    const match = hash.match(/trip=([^&]+)/);
    if (!match) return null;

    return decodeTripData(match[1]);
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
export function generateShareURL(tripData) {
    const encoded = encodeTripData(tripData);
    if (!encoded) return null;

    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}#trip=${encoded}`;
}

/**
 * Validates trip data structure
 */
export function validateTripData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Basic structural check
    const requiredKeys = ['tripConfig', 'days', 'flights'];
    for (const key of requiredKeys) {
        if (!(key in data)) return false;
    }
    
    if (typeof data.tripConfig !== 'object') return false;
    if (!Array.isArray(data.days)) return false;
    if (!Array.isArray(data.flights)) return false;
    
    return true;
}
