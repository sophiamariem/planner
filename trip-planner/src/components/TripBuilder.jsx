import React, { useState, useEffect } from 'react';
import { palette } from '../data/trip';
import { validateTripData } from '../utils/tripData';
import DayMap from './DayMap';

export default function TripBuilder({ tripData, onSave, onCancel, onReset }) {
    const [config, setConfig] = useState(tripData?.tripConfig || {
        title: "My Trip",
        footer: "My Adventure",
        favicon: null,
        calendar: { year: 2025, month: 0 },
        badgeLegend: []
    });

    const [days, setDays] = useState(tripData?.days || []);
    const [flights, setFlights] = useState(tripData?.flights || []);
    const [locations, setLocations] = useState(tripData?.ll || {});
    const [dayBadges, setDayBadges] = useState(tripData?.dayBadges || {});
    const [currentTab, setCurrentTab] = useState('basic');
    const [jsonInput, setJsonInput] = useState(JSON.stringify(tripData || {}, null, 2));
    const [jsonError, setJsonError] = useState("");
    const [newPinByDay, setNewPinByDay] = useState({});
    const [pinLoadingByDay, setPinLoadingByDay] = useState({});
    const [rangeStart, setRangeStart] = useState("");
    const [rangeEnd, setRangeEnd] = useState("");
    const [photoLoadingByDay, setPhotoLoadingByDay] = useState({});
    const [photoPicker, setPhotoPicker] = useState({
        open: false,
        dayIndex: null,
        query: "",
        results: [],
        selected: [],
    });
    const [toast, setToast] = useState(null);
    const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

    const pushToast = (message, tone = "info") => {
        setToast({ message, tone });
        setTimeout(() => setToast(null), 2500);
    };

    useEffect(() => {
        const isoDates = (days || []).map(d => d.isoDate).filter(Boolean).sort();
        if (isoDates.length > 0) {
            setRangeStart(isoDates[0]);
            setRangeEnd(isoDates[isoDates.length - 1]);
        }
    }, [days.length]);

    // Auto-save to localStorage (but don't trigger preview)
    useEffect(() => {
        const autoSaveTimer = setTimeout(() => {
            const tripData = { tripConfig: config, days, flights, ll: locations, palette, dayBadges };
            // Just save to localStorage, don't call onSave which would exit builder mode
            localStorage.setItem('current-trip', JSON.stringify(tripData));
        }, 1000);
        return () => clearTimeout(autoSaveTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config, days, flights, locations, dayBadges]);

    const addDay = () => {
        const previous = days[days.length - 1];
        let nextIso = "";
        if (previous?.isoDate) {
            const prevDate = new Date(previous.isoDate);
            if (!Number.isNaN(prevDate.getTime())) {
                prevDate.setDate(prevDate.getDate() + 1);
                nextIso = toIsoDate(prevDate);
            }
        }

        const newDay = {
            id: String(days.length + 1),
            dow: "Mon",
            date: "",
            isoDate: nextIso,
            title: defaultTitleForIndex(days.length, days.length + 1),
            photoQ: "",
            photos: [],
            hasMap: false,
            route: "",
            pins: [],
            notes: [],
        };
        if (nextIso) {
            Object.assign(newDay, dayFieldsFromIso(nextIso));
        }
        setDays([...days, newDay]);
    };

    const generateDaysFromRange = () => {
        if (!rangeStart || !rangeEnd) {
            pushToast("Choose both start and end date.", "error");
            return;
        }

        const start = new Date(rangeStart);
        const end = new Date(rangeEnd);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            pushToast("Invalid date range.", "error");
            return;
        }
        if (end < start) {
            pushToast("End date must be after start date.", "error");
            return;
        }

        const existingByIso = new Map(
            (days || [])
                .filter((d) => d.isoDate)
                .map((d) => [d.isoDate, d])
        );

        const generated = [];
        const cursor = new Date(start);
        while (cursor <= end) {
            const iso = toIsoDate(cursor);
            const existing = existingByIso.get(iso);
            const baseDay = {
                id: String(cursor.getDate()),
                dow: "",
                date: "",
                isoDate: iso,
                title: defaultTitleForIndex(generated.length, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1),
                photoQ: "",
                photos: [],
                hasMap: false,
                route: "",
                pins: [],
                notes: [],
            };

            generated.push({
                ...baseDay,
                ...dayFieldsFromIso(iso),
                ...(existing || {}),
                isoDate: iso,
            });

            cursor.setDate(cursor.getDate() + 1);
        }

        setDays(generated);
        setConfig({
            ...config,
            calendar: {
                year: start.getFullYear(),
                month: start.getMonth()
            }
        });
        pushToast(`Generated ${generated.length} day${generated.length > 1 ? "s" : ""}.`, "success");
    };

    const updateDay = (index, field, value) => {
        const updated = [...days];
        updated[index] = { ...updated[index], [field]: value };
        setDays(updated);
    };

    const updateDayObject = (index, patch) => {
        const updated = [...days];
        updated[index] = { ...updated[index], ...patch };
        setDays(updated);
    };

    const applyDateToDay = (index, isoDate) => {
        const updated = [...days];
        const merged = {
            ...updated[index],
            isoDate,
            ...dayFieldsFromIso(isoDate)
        };
        updated[index] = merged;
        setDays(updated);

        if (isoDate && index === 0) {
            const selected = new Date(isoDate);
            if (!Number.isNaN(selected.getTime())) {
                setConfig({
                    ...config,
                    calendar: {
                        year: selected.getFullYear(),
                        month: selected.getMonth()
                    }
                });
            }
        }
    };

    const removeDay = (index) => {
        setDays(days.filter((_, i) => i !== index));
    };

    const findPhotosForDay = async (index) => {
        const day = days[index];
        const query = buildPhotoQuery(day);
        if (!query) {
            pushToast("Add a title or place first so we can find photos.", "error");
            return;
        }

        setPhotoLoadingByDay((prev) => ({ ...prev, [index]: true }));
        try {
            const results = await fetchUnsplashResults(query, 18);
            if (!results.length) {
                pushToast("No photos found. Try editing the day title.", "error");
                return;
            }
            setPhotoPicker({
                open: true,
                dayIndex: index,
                query,
                results,
                selected: [],
            });
        } catch (_error) {
            pushToast("Couldn't fetch photos right now.", "error");
        } finally {
            setPhotoLoadingByDay((prev) => ({ ...prev, [index]: false }));
        }
    };

    const applyPickedPhotos = () => {
        const { dayIndex, selected, query } = photoPicker;
        if (dayIndex === null) return;
        if (!selected.length) {
            pushToast("Select at least one photo.", "error");
            return;
        }
        updateDayObject(dayIndex, {
            photos: selected,
            photoQ: query,
        });
        setPhotoPicker({
            open: false,
            dayIndex: null,
            query: "",
            results: [],
            selected: [],
        });
        pushToast("Photos updated.", "success");
    };

    const togglePickedPhoto = (url) => {
        setPhotoPicker((prev) => {
            const exists = prev.selected.includes(url);
            if (exists) {
                return { ...prev, selected: prev.selected.filter((u) => u !== url) };
            }
            if (prev.selected.length >= 4) {
                pushToast("Choose up to 4 photos.", "error");
                return prev;
            }
            return { ...prev, selected: [...prev.selected, url] };
        });
    };

    const addDayPhoto = (dayIndex) => {
        const updated = [...days];
        const photos = updated[dayIndex].photos ? [...updated[dayIndex].photos] : [];
        photos.push('');
        updated[dayIndex] = { ...updated[dayIndex], photos };
        setDays(updated);
    };

    const updateDayPhoto = (dayIndex, photoIndex, value) => {
        const updated = [...days];
        const photos = updated[dayIndex].photos ? [...updated[dayIndex].photos] : [];
        photos[photoIndex] = value;
        updated[dayIndex] = { ...updated[dayIndex], photos };
        setDays(updated);
    };

    const removeDayPhoto = (dayIndex, photoIndex) => {
        const updated = [...days];
        const photos = updated[dayIndex].photos ? [...updated[dayIndex].photos] : [];
        updated[dayIndex] = { ...updated[dayIndex], photos: photos.filter((_, i) => i !== photoIndex) };
        setDays(updated);
    };

    const pruneEmptyPhotos = (dayIndex) => {
        const updated = [...days];
        const photos = updated[dayIndex].photos ? updated[dayIndex].photos.filter(p => p.trim() !== '') : [];
        updated[dayIndex] = { ...updated[dayIndex], photos };
        setDays(updated);
    };

    const addFlight = () => {
        setFlights([...flights, {
            title: "Flight",
            num: "",
            route: "",
            date: "",
            times: "",
            codes: ""
        }]);
    };

    const updateFlight = (index, field, value) => {
        const updated = [...flights];
        updated[index] = { ...updated[index], [field]: value };
        setFlights(updated);
    };

    const removeFlight = (index) => {
        setFlights(flights.filter((_, i) => i !== index));
    };

    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            const validation = validateTripData(parsed);
            
            if (validation.valid) {
                // Automatically extract locations (ll) from pins if they are missing from top-level ll
                const importedLl = parsed.ll || {};
                const extractedLl = { ...importedLl };
                
                if (parsed.days && Array.isArray(parsed.days)) {
                  parsed.days.forEach(day => {
                    if (day.pins && Array.isArray(day.pins)) {
                      day.pins.forEach(pin => {
                        if (pin.name && pin.ll && !extractedLl[pin.name]) {
                          extractedLl[pin.name] = pin.ll;
                        }
                      });
                    }
                  });
                }

                // Automatically extract badges from notes if dayBadges is empty
                const importedBadges = parsed.dayBadges || {};
                const extractedBadges = { ...importedBadges };

                if (Object.keys(extractedBadges).length === 0 && parsed.days && Array.isArray(parsed.days)) {
                  parsed.days.forEach(day => {
                    const dayId = Number(day.id);
                    if (isNaN(dayId)) return;
                    
                    const emojis = [];
                    (day.notes || []).forEach(note => {
                      const found = note.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
                      if (found) emojis.push(...found);
                    });
                    
                    if (emojis.length > 0) {
                      extractedBadges[dayId] = [...new Set(emojis)];
                    }
                  });
                }

                setConfig(parsed.tripConfig);
                setDays((parsed.days || []).map(day => ({
                    ...day,
                    pins: day.pins || [],
                    notes: day.notes || []
                })));
                setFlights(parsed.flights || []);
                setLocations(extractedLl);
                setDayBadges(extractedBadges);
                setJsonError("");
                pushToast("JSON imported successfully.", "success");
            } else {
                setJsonError(`Invalid trip data: ${validation.error}`);
            }
        } catch (e) {
            setJsonError("Invalid JSON format. Please check your syntax.");
        }
    };

    const updateJsonFromState = () => {
        const currentTripData = { tripConfig: config, days, flights, ll: locations, palette, dayBadges };
        setJsonInput(JSON.stringify(currentTripData, null, 2));
    };

    const addPinToDayByName = async (dayIndex) => {
        const name = (newPinByDay[dayIndex] || "").trim();
        if (!name) {
            pushToast("Enter a stop name first.", "error");
            return;
        }

        const day = days[dayIndex];
        const currentPins = day.pins || [];
        if (currentPins.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
            pushToast("This stop is already on this day.", "error");
            return;
        }

        setPinLoadingByDay((prev) => ({ ...prev, [dayIndex]: true }));
        try {
            const result = await geocodePlace(name);
            if (!result) {
                pushToast("Couldn't find that place. Try a more specific name.", "error");
                return;
            }

            const canonicalName = name;
            const ll = [result.lat, result.lon];
            const newPin = { name: canonicalName, q: canonicalName, ll };
            updateDay(dayIndex, 'pins', [...currentPins, newPin]);
            setLocations({ ...locations, [canonicalName]: ll });
            setNewPinByDay((prev) => ({ ...prev, [dayIndex]: "" }));
            pushToast("Stop added to this day.", "success");
        } finally {
            setPinLoadingByDay((prev) => ({ ...prev, [dayIndex]: false }));
        }
    };

    async function geocodePlace(query) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: {
                Accept: "application/json",
            }
        });
        if (!res.ok) return null;
        const rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) return null;
        const top = rows[0];
        const lat = parseFloat(top.lat);
        const lon = parseFloat(top.lon);
        if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
        return { lat, lon };
    }

    function dayFieldsFromIso(isoDate) {
        const dateObj = new Date(isoDate);
        if (!isoDate || Number.isNaN(dateObj.getTime())) {
            return { dow: "", date: "", id: "" };
        }
        return {
            dow: DAY_SHORT[dateObj.getDay()],
            date: `${dateObj.getDate()} ${MONTH_SHORT[dateObj.getMonth()]}`,
            id: String(dateObj.getDate()),
        };
    }

    function toIsoDate(dateObj) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(dateObj.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    function defaultTitleForIndex(index, totalDays) {
        if (index === 0) return "Arrival";
        if (index === totalDays - 1) return "Departure";
        const mids = ["Explore", "Highlights", "Local Favorites", "Adventure", "Leisure Day"];
        return mids[(index - 1) % mids.length];
    }

    function buildPhotoQuery(day) {
        if (day?.photoQ?.trim()) return day.photoQ.trim();

        const parts = [];
        const tripTitle = String(config?.title || "").replace(/\btrip\b/gi, "").trim();
        if (tripTitle) parts.push(tripTitle);
        if (day?.title?.trim()) parts.push(day.title.trim());
        if (day?.pins?.length) parts.push(day.pins[0].name);

        return parts.join(" ").trim();
    }

    async function fetchUnsplashResults(query, count = 18) {
        if (UNSPLASH_ACCESS_KEY) {
            const api = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&content_filter=high`;
            const res = await fetch(api, {
                headers: {
                    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                    Accept: "application/json",
                }
            });

            if (res.ok) {
                const data = await res.json();
                const results = Array.isArray(data?.results) ? data.results : [];
                const normalized = results
                    .map((r) => ({
                        thumb: r?.urls?.small || r?.urls?.thumb,
                        full: r?.urls?.regular || r?.urls?.small,
                    }))
                    .filter((r) => r.thumb && r.full)
                    .slice(0, count);
                if (normalized.length) return normalized;
            }
        }

        return Array.from({ length: count }, (_, i) => {
            const full = `https://source.unsplash.com/1200x800/?${encodeURIComponent(query)}&sig=${Date.now()}${i}`;
            return { thumb: full, full };
        });
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            {photoPicker.open && (
                <div className="fixed inset-0 z-[90]" onClick={() => setPhotoPicker((prev) => ({ ...prev, open: false }))}>
                    <div className="absolute inset-0 bg-black/40" />
                    <aside className="absolute right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900">Choose Photos</h3>
                                <p className="text-sm text-zinc-600 mt-1">{photoPicker.query}</p>
                            </div>
                            <button
                                onClick={() => setPhotoPicker((prev) => ({ ...prev, open: false }))}
                                className="px-3 py-2 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-50"
                            >
                                Close
                            </button>
                        </div>

                        <p className="text-xs text-zinc-500 mt-3">Select up to 4 photos.</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                            {photoPicker.results.map((photo, i) => {
                                const selected = photoPicker.selected.includes(photo.full);
                                return (
                                    <button
                                        key={`${photo.full}-${i}`}
                                        type="button"
                                        onClick={() => togglePickedPhoto(photo.full)}
                                        className={`relative rounded-xl overflow-hidden border-2 ${selected ? "border-blue-600" : "border-transparent"}`}
                                    >
                                        <img src={photo.thumb} alt="" className="w-full h-32 object-cover" loading="lazy" />
                                        {selected && (
                                            <span className="absolute top-2 right-2 text-xs bg-blue-600 text-white rounded-full px-2 py-1">
                                                Selected
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setPhotoPicker((prev) => ({ ...prev, open: false }))}
                                className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyPickedPhotos}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                                Use Selected ({photoPicker.selected.length})
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90]">
                    <div className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
                        toast.tone === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : toast.tone === "error"
                                ? "bg-red-50 border-red-200 text-red-700"
                                : "bg-white border-zinc-200 text-zinc-800"
                    }`}>
                        {toast.message}
                    </div>
                </div>
            )}
            <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-zinc-900">Trip Builder</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={onReset}
                                className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium"
                            >
                                Reset
                            </button>
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onSave({ tripConfig: config, days, flights, ll: locations, palette, dayBadges })}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                            >
                                Save & Preview
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 mt-4 overflow-x-auto">
                        {['basic', 'flights', 'days', 'JSON (Advanced)'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setCurrentTab(tab);
                                    if (tab === 'JSON (Advanced)') updateJsonFromState();
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                                    currentTab === tab
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'hover:bg-zinc-100 text-zinc-600'
                                }`}
                            >
                                {tab === 'JSON (Advanced)' ? 'JSON (Advanced)' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6">
                {currentTab === 'basic' && (
                    <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
                        <h2 className="text-xl font-bold text-zinc-900">Basic Information</h2>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Trip Title</label>
                            <input
                                type="text"
                                value={config.title}
                                onChange={e => setConfig({ ...config, title: e.target.value })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="My Amazing Trip • June 2025"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Footer Text</label>
                            <input
                                type="text"
                                value={config.footer}
                                onChange={e => setConfig({ ...config, footer: e.target.value })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Adventure awaits! 🌍"
                            />
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Favicon URL (optional)</label>
                            <input
                                type="url"
                                value={config.favicon || ''}
                                onChange={e => setConfig({ ...config, favicon: e.target.value || null })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://example.com/icon.jpg"
                            />
                        </div>
                    </div>
                )}

                {currentTab === 'flights' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900">Flights</h2>
                            <button
                                onClick={addFlight}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                            >
                                + Add Flight
                            </button>
                        </div>

                        {flights.map((flight, index) => (
                            <div key={index} className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-zinc-900">Flight {index + 1}</h3>
                                    <button
                                        onClick={() => removeFlight(index)}
                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={flight.title}
                                        onChange={e => updateFlight(index, 'title', e.target.value)}
                                        placeholder="Flight out"
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={flight.num}
                                        onChange={e => updateFlight(index, 'num', e.target.value)}
                                        placeholder="Flight number (e.g. BA123)"
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={flight.route}
                                        onChange={e => updateFlight(index, 'route', e.target.value)}
                                        placeholder="Route (e.g. London → Paris)"
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={flight.codes}
                                        onChange={e => updateFlight(index, 'codes', e.target.value)}
                                        placeholder="Airport codes (e.g. LHR → CDG)"
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={flight.date}
                                        onChange={e => updateFlight(index, 'date', e.target.value)}
                                        placeholder="Date (e.g. Mon, 15 Jun 2025)"
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={flight.times}
                                        onChange={e => updateFlight(index, 'times', e.target.value)}
                                        placeholder="Times (e.g. 10:00 → 12:30)"
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        ))}

                        {flights.length === 0 && (
                            <div className="bg-white rounded-lg p-12 shadow-sm text-center text-zinc-500">
                                No flights added yet. Click "Add Flight" to get started.
                            </div>
                        )}
                    </div>
                )}

                {currentTab === 'days' && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg p-5 shadow-sm border border-zinc-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-zinc-900">Daily Itinerary</h2>
                                <span className="text-xs text-zinc-500">{days.length} day{days.length === 1 ? "" : "s"}</span>
                            </div>
                            <p className="text-sm text-zinc-600">
                                Start with dates first. We will generate each day and auto-fill weekday labels.
                            </p>
                            <div className="grid md:grid-cols-3 gap-3">
                                <input
                                    type="date"
                                    value={rangeStart}
                                    onChange={e => setRangeStart(e.target.value)}
                                    className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="date"
                                    value={rangeEnd}
                                    onChange={e => setRangeEnd(e.target.value)}
                                    className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={generateDaysFromRange}
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                                >
                                    Generate Days
                                </button>
                            </div>
                            <div>
                                <button
                                    onClick={addDay}
                                    className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-sm font-medium"
                                >
                                    + Add Single Day
                                </button>
                            </div>
                        </div>

                        {days.map((day, index) => (
                            <div key={index} className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-zinc-900">
                                        Day {index + 1}
                                        {day.date ? <span className="ml-2 text-zinc-500 font-normal">({day.dow}, {day.date})</span> : null}
                                    </h3>
                                    <button
                                        onClick={() => removeDay(index)}
                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="rounded-lg border border-zinc-200 p-4 bg-zinc-50">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-2">Date</label>
                                            <input
                                                type="date"
                                                value={day.isoDate || ''}
                                                onChange={e => applyDateToDay(index, e.target.value)}
                                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="text-sm text-zinc-700 flex items-end">
                                            {day.isoDate ? (
                                                <p><strong>{day.dow}, {day.date}</strong></p>
                                            ) : (
                                                <p className="text-zinc-500">Set a date to organize this day.</p>
                                            )}
                                        </div>
                                    </div>

                                    <details className="mt-3">
                                        <summary className="cursor-pointer text-sm text-zinc-700 font-medium">Advanced: manually edit date fields</summary>
                                        <div className="grid md:grid-cols-3 gap-4 mt-3">
                                            <input
                                                type="text"
                                                value={day.dow}
                                                onChange={e => updateDay(index, 'dow', e.target.value)}
                                                placeholder="Day of week (e.g. Mon)"
                                                className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                value={day.date}
                                                onChange={e => updateDay(index, 'date', e.target.value)}
                                                placeholder="Date label (e.g. 15 Jun)"
                                                className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                value={day.id}
                                                onChange={e => updateDay(index, 'id', e.target.value)}
                                                placeholder="Calendar day #"
                                                className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </details>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={day.title}
                                        onChange={e => updateDay(index, 'title', e.target.value)}
                                        placeholder="What is this day about?"
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <textarea
                                    value={day.notes.join('\n')}
                                    onChange={e => updateDay(index, 'notes', e.target.value.split('\n'))}
                                    placeholder="Notes (press Enter for new line)&#10;Example:&#10;Check in at hotel&#10;Dinner at 7pm&#10;Evening walk"
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                                />

                                <div className="border border-zinc-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-zinc-700">Photos</label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => findPhotosForDay(index)}
                                                disabled={photoLoadingByDay[index]}
                                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {photoLoadingByDay[index] ? "Finding..." : "Find Photos"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addDayPhoto(index)}
                                                className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800"
                                            >
                                                + Add URL
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Use "Find Photos" for automatic images, or paste your own image URLs.
                                    </p>
                                    <div className="mt-3 space-y-2">
                                        {(day.photos || []).length === 0 && (
                                            <p className="text-sm text-zinc-500 italic">No photos added yet.</p>
                                        )}
                                        {(day.photos || []).map((photoUrl, photoIndex) => (
                                            <div key={`${index}-photo-${photoIndex}`} className="flex items-center gap-2">
                                                <input
                                                    type="url"
                                                    value={photoUrl}
                                                    onChange={e => updateDayPhoto(index, photoIndex, e.target.value)}
                                                    onBlur={() => pruneEmptyPhotos(index)}
                                                    placeholder="https://example.com/photo.jpg"
                                                    className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeDayPhoto(index, photoIndex)}
                                                    className="px-2 py-2 rounded-lg text-red-600 hover:text-red-700 text-sm font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-zinc-200 pt-4 mt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-zinc-700">Map Stops</label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={day.hasMap || false}
                                                onChange={e => updateDay(index, 'hasMap', e.target.checked)}
                                                className="rounded"
                                            />
                                            <span>Show route map on card</span>
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={newPinByDay[index] || ""}
                                            onChange={(e) => setNewPinByDay((prev) => ({ ...prev, [index]: e.target.value }))}
                                            placeholder="Add stop (e.g. Colosseum, Rome)"
                                            className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addPinToDayByName(index)}
                                            disabled={pinLoadingByDay[index]}
                                            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {pinLoadingByDay[index] ? "Adding..." : "Add Stop"}
                                        </button>
                                    </div>

                                    {Object.keys(locations).length > 0 && (
                                        <details className="mb-3">
                                            <summary className="cursor-pointer text-xs text-zinc-600 font-medium">Add from saved places</summary>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {Object.keys(locations).map(locName => {
                                                    const isSelected = day.pins?.some(p => p.name === locName) || false;
                                                    return (
                                                        <button
                                                            key={locName}
                                                            type="button"
                                                            onClick={() => {
                                                                const currentPins = day.pins || [];
                                                                if (isSelected) {
                                                                    updateDay(index, 'pins', currentPins.filter(p => p.name !== locName));
                                                                } else {
                                                                    const newPin = {
                                                                        name: locName,
                                                                        q: locName,
                                                                        ll: locations[locName]
                                                                    };
                                                                    updateDay(index, 'pins', [...currentPins, newPin]);
                                                                }
                                                            }}
                                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                                                isSelected
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                                            }`}
                                                        >
                                                            {isSelected ? '✓ ' : ''}{locName}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </details>
                                    )}

                                    {(day.pins && day.pins.length > 0) ? (
                                        <div className="flex flex-wrap gap-2">
                                            {(day.pins || []).map((pin, pinIdx) => (
                                                <span key={`${pin.name}-${pinIdx}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-sm">
                                                    {pin.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => updateDay(index, 'pins', (day.pins || []).filter((_, i) => i !== pinIdx))}
                                                        className="text-zinc-500 hover:text-red-600"
                                                        aria-label={`Remove ${pin.name}`}
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-zinc-500 italic">No stops yet. Add one to show it on the map.</p>
                                    )}

                                    {day.hasMap && (day.pins || []).length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs text-zinc-500 mb-2">Map preview</p>
                                            <DayMap pins={day.pins} className="h-52" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {days.length === 0 && (
                            <div className="bg-white rounded-lg p-12 shadow-sm text-center text-zinc-500">
                                No days added yet. Click "Add Day" to start building your itinerary.
                            </div>
                        )}
                    </div>
                )}

                {currentTab === 'JSON (Advanced)' && (
                    <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900">Direct JSON Edit</h2>
                            <button
                                onClick={handleJsonImport}
                                className="px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-medium"
                            >
                                Apply JSON Changes
                            </button>
                        </div>

                        <p className="text-sm text-zinc-600">
                            For tech-savvy users: You can edit the entire trip data structure directly as JSON. 
                            Changes will only be applied when you click "Apply JSON Changes".
                        </p>

                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            className="w-full h-[500px] p-4 border border-zinc-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder='{ "tripConfig": { ... }, "days": [], "flights": [] }'
                        />

                        {jsonError && (
                            <p className="text-red-600 text-sm">{jsonError}</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
