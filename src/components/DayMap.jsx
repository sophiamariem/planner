import { useEffect, useRef } from "react";
import L from "leaflet";
import { boundsFor } from "../utils/maps";

function ensureLeafletCSS() {
    if (typeof document === "undefined") return;
    if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
    }
    if (!document.getElementById("leaflet-zfix")) {
        const style = document.createElement("style");
        style.id = "leaflet-zfix";
        style.textContent = ".leaflet-container,.leaflet-top,.leaflet-bottom{z-index:0!important}";
        document.head.appendChild(style);
    }
}

export default function DayMap({ pins, className = "h-56 md:h-72" }) {
    const mapRef = useRef(null);
    const divRef = useRef(null);
    const validPins = (pins || []).filter((p) =>
        Array.isArray(p?.ll)
        && p.ll.length === 2
        && Number.isFinite(Number(p.ll[0]))
        && Number.isFinite(Number(p.ll[1]))
    );

    useEffect(() => {
        ensureLeafletCSS();
        if (!divRef.current) return;
        if (validPins.length === 0) return;
        if (!mapRef.current) {
            mapRef.current = L.map(divRef.current, { zoomControl: true, scrollWheelZoom: false });
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(mapRef.current);
        }
        const pts = validPins.map(p => [Number(p.ll[0]), Number(p.ll[1])]);
        const b = boundsFor(pts);
        mapRef.current.fitBounds(b, { padding: [10, 10] });
        const poly = L.polyline(pts, { color: "#2563eb", weight: 5, opacity: 0.9 }).addTo(mapRef.current);
        const markers = validPins.map((p, i) => {
            const m = L.circleMarker([Number(p.ll[0]), Number(p.ll[1])], { radius: 10, color: "#111827", fillColor: "#111827", fillOpacity: 1 }).addTo(mapRef.current);
            m.bindTooltip(`${i + 1}. ${p.name}`, { direction: "top", offset: [0, -8] });
            return m;
        });
        setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 0);
        return () => {
            poly.remove();
            markers.forEach(m => m.remove());
        };
    }, [validPins]);

    useEffect(() => () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }, []);

    return <div ref={divRef} className={`${className} w-full rounded-3xl overflow-hidden ring-1 ring-zinc-200 relative z-0`}/>;
}
