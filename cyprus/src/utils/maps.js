export function mapSearch(q) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function mapDir(origin, destination, waypoints = []) {
    const base = "https://www.google.com/maps/dir/?api=1&travelmode=driving";
    const o = `&origin=${encodeURIComponent(origin)}`;
    const d = `&destination=${encodeURIComponent(destination)}`;
    const w = waypoints.length ? `&waypoints=${encodeURIComponent(waypoints.join("|"))}` : "";
    return `${base}${o}${d}${w}`;
}

export function boundsFor(points) {
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const padLat = (maxLat - minLat) * 0.25 || 0.08;
    const padLng = (maxLng - minLng) * 0.25 || 0.08;
    return [[minLat - padLat, minLng - padLng], [maxLat + padLat, maxLng + padLng]];
}
