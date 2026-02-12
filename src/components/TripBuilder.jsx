import React, { useState, useEffect } from 'react';
import { palette } from '../data/trip';
import { validateTripData } from '../utils/tripData';
import DayMap from './DayMap';

export default function TripBuilder({ tripData, onSave, onCancel, onHome, onReset, initialTab = "basic", isAdmin = false }) {
    const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

    function normalizeArrowText(value) {
        if (typeof value !== "string") return value;
        return value.replace(/\s*->\s*/g, " → ");
    }

    function hydrateConfig(inputConfig) {
        const base = inputConfig || {};
        return {
            ...base,
            title: normalizeArrowText(String(base.title || "My Trip")),
            footer: normalizeArrowText(String(base.footer || "My Adventure")),
            favicon: base.favicon || null,
            cover: base.cover || null,
            calendar: {
                year: Number(base?.calendar?.year) || 2025,
                month: Number(base?.calendar?.month) >= 0 ? Number(base.calendar.month) : 0,
            },
            badgeLegend: Array.isArray(base.badgeLegend) ? base.badgeLegend : [],
        };
    }

    const [config, setConfig] = useState(hydrateConfig(tripData?.tripConfig));

    const [days, setDays] = useState(() => hydrateDays(tripData?.days || [], tripData?.tripConfig));
    const [flights, setFlights] = useState(() => (tripData?.flights || []).map(hydrateFlight));
    const [locations, setLocations] = useState(tripData?.ll || {});
    const [dayBadges, setDayBadges] = useState(tripData?.dayBadges || {});
    const [currentTab, setCurrentTab] = useState(isAdmin || initialTab !== "JSON (Advanced)" ? initialTab : "basic");
    const [jsonInput, setJsonInput] = useState(JSON.stringify(tripData || {}, null, 2));
    const [jsonError, setJsonError] = useState("");
    const [newPinByDay, setNewPinByDay] = useState({});
    const [badgeInputByDay, setBadgeInputByDay] = useState({});
    const [pinLoadingByDay, setPinLoadingByDay] = useState({});
    const [pinSuggestionsByDay, setPinSuggestionsByDay] = useState({});
    const [pinSuggestLoadingByDay, setPinSuggestLoadingByDay] = useState({});
    const [rangeStart, setRangeStart] = useState("");
    const [rangeEnd, setRangeEnd] = useState("");
    const [photoLoadingByDay, setPhotoLoadingByDay] = useState({});
    const [showPhotoUrlInputByDay, setShowPhotoUrlInputByDay] = useState({});
    const [photoUrlDraftByDay, setPhotoUrlDraftByDay] = useState({});
    const [expandedDaysByIndex, setExpandedDaysByIndex] = useState({});
    const [showValidationPanel, setShowValidationPanel] = useState(false);
    const [autosaveState, setAutosaveState] = useState("saved");
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [photoPicker, setPhotoPicker] = useState({
        open: false,
        dayIndex: null,
        query: "",
        results: [],
        selected: [],
    });
    const [toast, setToast] = useState(null);
    const tabs = isAdmin ? ['basic', 'flights', 'days', 'JSON (Advanced)'] : ['basic', 'flights', 'days'];

    const pushToast = (message, tone = "info") => {
        setToast({ message, tone });
        setTimeout(() => setToast(null), 2500);
    };

    const COMMON_BADGES = ["✈️", "🚆", "🚗", "🏛️", "🏖️", "🍷", "🎉", "🌅", "🍽️", "🛍️"];
    const checklist = [
        { key: "basic", label: "Trip basics", done: Boolean(config.title?.trim()) },
        { key: "dates", label: "Dates", done: days.length > 0 && days.every((d) => hasUsableDayDate(d)) },
        { key: "days", label: "Day plans", done: days.length > 0 && days.every((d) => Boolean(String(d.title || "").trim())) },
        { key: "photos", label: "Photos", done: days.some((d) => (d.photos || []).length > 0) },
        { key: "share", label: "Ready to share", done: days.length > 0 && days.every((d) => hasUsableDayDate(d)) && Boolean(config.title?.trim()) },
    ];

    const validationIssues = buildValidationIssues();

    useEffect(() => {
        if (!isAdmin && currentTab === "JSON (Advanced)") {
            setCurrentTab("basic");
        }
    }, [isAdmin, currentTab]);

    const addBadgeToDay = (day, emoji) => {
        const clean = String(emoji || "").trim();
        if (!clean) {
            pushToast("Enter an emoji badge first.", "error");
            return;
        }
        const dayKey = Number(day?.id);
        if (Number.isNaN(dayKey)) {
            pushToast("Set the day date first so we can place this on the calendar.", "error");
            return;
        }

        setDayBadges((prev) => {
            const current = Array.isArray(prev[dayKey]) ? prev[dayKey] : [];
            if (current.includes(clean)) return prev;
            if (current.length >= 3) {
                pushToast("Use up to 3 badges per day.", "error");
                return prev;
            }
            return { ...prev, [dayKey]: [...current, clean] };
        });
    };

    const removeBadgeFromDay = (day, badgeIndex) => {
        const dayKey = Number(day?.id);
        if (Number.isNaN(dayKey)) return;

        setDayBadges((prev) => {
            const current = Array.isArray(prev[dayKey]) ? prev[dayKey] : [];
            const next = current.filter((_, i) => i !== badgeIndex);
            if (next.length === 0) {
                const copy = { ...prev };
                delete copy[dayKey];
                return copy;
            }
            return { ...prev, [dayKey]: next };
        });
    };

    function buildValidationIssues() {
        const issues = [];
        if (!String(config?.title || "").trim()) {
            issues.push({ key: "title", label: "Add a trip title", tab: "basic" });
        }
        if (!days.length) {
            issues.push({ key: "days", label: "Add at least one day", tab: "days" });
        }
        if ((days || []).some((d) => !hasUsableDayDate(d))) {
            issues.push({ key: "missing-day-dates", label: "Set date for each day", tab: "days" });
        }
        if ((flights || []).some((f) => !String(f.flightFrom || "").trim() || !String(f.flightTo || "").trim())) {
            issues.push({ key: "flight-route", label: "Complete all flight from/to fields", tab: "flights" });
        }
        return issues;
    }

    function hasUsableDayDate(day) {
        if (day?.isoDate) return true;
        return Boolean(String(day?.dow || "").trim() && String(day?.date || "").trim() && String(day?.id || "").trim());
    }

    const handleSaveClick = () => {
        if (validationIssues.length > 0) {
            setShowValidationPanel(true);
            pushToast("Fix required items before preview.", "error");
            return;
        }
        const normalizedConfig = hydrateConfig(config);
        const normalizedDays = hydrateDays(days, normalizedConfig);
        const normalizedFlights = flights.map(hydrateFlight);
        onSave({ tripConfig: normalizedConfig, days: normalizedDays, flights: normalizedFlights, ll: locations, palette, dayBadges });
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
        setAutosaveState("saving");
        const autoSaveTimer = setTimeout(() => {
            const tripData = {
                tripConfig: hydrateConfig(config),
                days: hydrateDays(days, config),
                flights: flights.map(hydrateFlight),
                ll: locations,
                palette,
                dayBadges
            };
            // Just save to localStorage, don't call onSave which would exit builder mode
            localStorage.setItem('current-trip', JSON.stringify(tripData));
            setAutosaveState("saved");
            setLastSavedAt(new Date());
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
        let nextValue = value;
        if (typeof nextValue === "string") {
            nextValue = normalizeArrowText(nextValue);
        } else if (field === "notes" && Array.isArray(nextValue)) {
            nextValue = nextValue.map((note) => normalizeArrowText(String(note || "")));
        }
        const updated = [...days];
        updated[index] = { ...updated[index], [field]: nextValue };
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

    const removeDayPhoto = (dayIndex, photoIndex) => {
        const updated = [...days];
        const photos = updated[dayIndex].photos ? [...updated[dayIndex].photos] : [];
        updated[dayIndex] = { ...updated[dayIndex], photos: photos.filter((_, i) => i !== photoIndex) };
        setDays(updated);
    };

    const addPhotoUrlToDay = (dayIndex) => {
        const url = String(photoUrlDraftByDay[dayIndex] || "").trim();
        if (!url) {
            pushToast("Paste an image URL first.", "error");
            return;
        }
        const updated = [...days];
        const photos = updated[dayIndex].photos ? [...updated[dayIndex].photos] : [];
        photos.push(url);
        updated[dayIndex] = { ...updated[dayIndex], photos };
        setDays(updated);
        setPhotoUrlDraftByDay((prev) => ({ ...prev, [dayIndex]: "" }));
        setShowPhotoUrlInputByDay((prev) => ({ ...prev, [dayIndex]: false }));
    };

    const addFlight = () => {
        setFlights([...flights, hydrateFlight({
            flightFrom: "",
            flightTo: "",
            departureDate: "",
            departureTime: "",
            arrivalTime: "",
            title: "",
            num: "",
            route: "",
            date: "",
            times: "",
            codes: ""
        })]);
    };

    const addReturnFlight = () => {
        const last = flights[flights.length - 1];
        if (!last?.flightFrom || !last?.flightTo) {
            pushToast("Add an outbound flight first.", "error");
            return;
        }

        let returnDate = "";
        if (last.departureDate) {
            const d = new Date(last.departureDate);
            if (!Number.isNaN(d.getTime())) {
                d.setDate(d.getDate() + 7);
                returnDate = toIsoDate(d);
            }
        }

        const draft = hydrateFlight({
            flightFrom: last.flightTo,
            flightTo: last.flightFrom,
            departureDate: returnDate,
            departureTime: "",
            arrivalTime: "",
            num: "",
            codes: "",
            title: "",
        });
        setFlights([...flights, draft]);
    };

    const updateFlight = (index, field, value) => {
        const nextValue = typeof value === "string" ? normalizeArrowText(value) : value;
        const updated = [...flights];
        updated[index] = hydrateFlight({ ...updated[index], [field]: nextValue });
        setFlights(updated);
    };

    const addTravelDayFromFlight = (index) => {
        const flight = flights[index];
        if (!flight?.departureDate) {
            pushToast("Set a flight date first.", "error");
            return;
        }

        if (days.some((d) => d.isoDate === flight.departureDate)) {
            pushToast("A day already exists for this date.", "error");
            return;
        }

        const newDay = {
            id: String(new Date(flight.departureDate).getDate()),
            ...dayFieldsFromIso(flight.departureDate),
            isoDate: flight.departureDate,
            title: `Travel: ${flight.flightFrom || "Departure"} → ${flight.flightTo || "Arrival"}`,
            photoQ: "",
            photos: [],
            hasMap: false,
            route: "",
            pins: [],
            notes: [flight.num ? `Flight ${flight.num}` : "Travel day"],
        };

        const merged = [...days, newDay].sort((a, b) => {
            if (!a.isoDate || !b.isoDate) return 0;
            return a.isoDate.localeCompare(b.isoDate);
        });
        setDays(merged);
        pushToast("Travel day added.", "success");
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

                setConfig(hydrateConfig(parsed.tripConfig));
                setDays(hydrateDays(parsed.days || [], parsed.tripConfig));
                setFlights((parsed.flights || []).map(hydrateFlight));
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
        const currentTripData = {
            tripConfig: hydrateConfig(config),
            days: hydrateDays(days, config),
            flights: flights.map(hydrateFlight),
            ll: locations,
            palette,
            dayBadges
        };
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
            setPinSuggestionsByDay((prev) => ({ ...prev, [dayIndex]: [] }));
            pushToast("Stop added to this day.", "success");
        } finally {
            setPinLoadingByDay((prev) => ({ ...prev, [dayIndex]: false }));
        }
    };

    const fetchPinSuggestions = async (dayIndex, query) => {
        const clean = String(query || "").trim();
        setNewPinByDay((prev) => ({ ...prev, [dayIndex]: query }));
        if (clean.length < 3) {
            setPinSuggestionsByDay((prev) => ({ ...prev, [dayIndex]: [] }));
            return;
        }
        setPinSuggestLoadingByDay((prev) => ({ ...prev, [dayIndex]: true }));
        try {
            const rows = await geocodePlaceSearch(clean, 3);
            setPinSuggestionsByDay((prev) => ({ ...prev, [dayIndex]: rows }));
        } finally {
            setPinSuggestLoadingByDay((prev) => ({ ...prev, [dayIndex]: false }));
        }
    };

    const addPinFromSuggestion = (dayIndex, row) => {
        const day = days[dayIndex];
        const currentPins = day.pins || [];
        if (currentPins.some((p) => p.name.toLowerCase() === row.name.toLowerCase())) {
            pushToast("This stop is already on this day.", "error");
            return;
        }
        const ll = [row.lat, row.lon];
        const newPin = { name: row.name, q: row.query || row.name, ll };
        updateDay(dayIndex, "pins", [...currentPins, newPin]);
        setLocations({ ...locations, [row.name]: ll });
        setNewPinByDay((prev) => ({ ...prev, [dayIndex]: row.name }));
        setPinSuggestionsByDay((prev) => ({ ...prev, [dayIndex]: [] }));
        pushToast("Stop added to this day.", "success");
    };

    async function geocodePlace(query) {
        const rows = await geocodePlaceSearch(query, 1);
        if (!rows.length) return null;
        return rows[0];
    }

    async function geocodePlaceSearch(query, limit = 3) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: {
                Accept: "application/json",
            }
        });
        if (!res.ok) return [];
        const rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) return [];
        return rows
            .slice(0, limit)
            .map((row) => {
                const lat = parseFloat(row.lat);
                const lon = parseFloat(row.lon);
                const display = String(row.display_name || "").trim();
                const short = display.split(",").slice(0, 2).join(",").trim() || query;
                if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
                return { name: short, query: display || short, lat, lon };
            })
            .filter(Boolean);
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

    function hydrateDays(inputDays, tripConfigValue) {
        const calendarYear = Number(tripConfigValue?.calendar?.year) || new Date().getFullYear();
        const calendarMonth = Number(tripConfigValue?.calendar?.month);
        return (inputDays || []).map((day) => {
            const base = {
                ...day,
                pins: day.pins || [],
                title: normalizeArrowText(day.title || ""),
                route: normalizeArrowText(day.route || ""),
                photoQ: normalizeArrowText(day.photoQ || ""),
                notes: Array.isArray(day.notes) ? day.notes.map((note) => normalizeArrowText(String(note || ""))) : [],
                photos: day.photos || [],
            };

            if (base.isoDate) {
                const hydratedFromIso = dayFieldsFromIso(base.isoDate);
                return { ...base, ...hydratedFromIso };
            }

            const inferred = inferIsoDateFromLegacyFields(base, calendarYear, calendarMonth);
            if (!inferred) return base;
            return {
                ...base,
                isoDate: inferred,
                ...dayFieldsFromIso(inferred),
            };
        });
    }

    function inferIsoDateFromLegacyFields(day, year, fallbackMonth) {
        const dateText = String(day?.date || "").trim();
        if (dateText) {
            const match = dateText.match(/^(\d{1,2})\s+([A-Za-z]{3,})$/);
            if (match) {
                const dd = Number(match[1]);
                const monToken = match[2].slice(0, 3).toLowerCase();
                const mon = MONTH_SHORT.findIndex((m) => m.toLowerCase() === monToken);
                if (!Number.isNaN(dd) && mon >= 0) {
                    const dt = new Date(year, mon, dd);
                    if (!Number.isNaN(dt.getTime())) return toIsoDate(dt);
                }
            }
        }

        const idNum = Number(day?.id);
        if (!Number.isNaN(idNum) && idNum > 0 && fallbackMonth >= 0 && fallbackMonth <= 11) {
            const dt = new Date(year, fallbackMonth, idNum);
            if (!Number.isNaN(dt.getTime())) return toIsoDate(dt);
        }
        return "";
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

    function hydrateFlight(flight) {
        const routeFromSplit = (flight.route || "").split(/→|->/).map((s) => s.trim()).filter(Boolean);
        const timesFromSplit = (flight.times || "").split(/→|->/).map((s) => s.trim()).filter(Boolean);

        const flightFrom = flight.flightFrom || routeFromSplit[0] || "";
        const flightTo = flight.flightTo || routeFromSplit[1] || "";
        const departureDate = flight.departureDate || parseDisplayDateToIso(flight.date) || "";
        const departureTime = flight.departureTime || timesFromSplit[0] || "";
        const arrivalTime = flight.arrivalTime || timesFromSplit[1] || "";

        return {
            ...flight,
            flightFrom,
            flightTo,
            departureDate,
            departureTime,
            arrivalTime,
            route: flightFrom && flightTo ? `${flightFrom} → ${flightTo}` : normalizeArrowText(flight.route || ""),
            date: departureDate ? formatIsoAsDisplayDate(departureDate) : (flight.date || ""),
            times: departureTime || arrivalTime
                ? `${departureTime || "—"} → ${arrivalTime || "—"}`
                : normalizeArrowText(flight.times || ""),
            title: normalizeArrowText(flight.title || (flightFrom && flightTo ? `Flight: ${flightFrom} → ${flightTo}` : "Flight")),
        };
    }

    function parseDisplayDateToIso(display) {
        if (!display) return "";
        const parsed = new Date(display);
        if (Number.isNaN(parsed.getTime())) return "";
        return toIsoDate(parsed);
    }

    function formatIsoAsDisplayDate(isoDate) {
        const dateObj = new Date(isoDate);
        if (!isoDate || Number.isNaN(dateObj.getTime())) return "";
        return `${DAY_SHORT[dateObj.getDay()]}, ${dateObj.getDate()} ${MONTH_SHORT[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
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
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <img src="/favicon.png" alt="plnr.guide" className="w-6 h-6 rounded-md border border-zinc-200 bg-white object-cover" />
                                <span className="text-xs font-semibold tracking-wide text-blue-700">plnr.guide</span>
                            </div>
                            <h1 className="text-2xl font-bold text-zinc-900">Trip Builder</h1>
                            <p className="text-xs text-zinc-500 mt-1">
                                {autosaveState === "saving" ? "Saving draft..." : `Saved${lastSavedAt ? ` ${lastSavedAt.toLocaleTimeString()}` : ""}`}
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={onHome}
                                className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-sm font-medium"
                            >
                                Trips
                            </button>
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-sm font-medium"
                            >
                                Preview
                            </button>
                            <button
                                onClick={handleSaveClick}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                            >
                                Save
                            </button>
                            <details className="relative">
                                <summary className="list-none cursor-pointer px-3 py-2 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-50">
                                    More
                                </summary>
                                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-zinc-200 bg-white shadow-lg p-2 flex flex-col gap-1 z-20">
                                    <button
                                        onClick={onReset}
                                        className="text-left px-3 py-2 rounded-lg text-sm hover:bg-red-50 text-red-600"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </details>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 mt-4 overflow-x-auto">
                        {tabs.map(tab => (
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
                    <div className="mt-4 flex flex-wrap gap-2">
                        {checklist.map((item) => (
                            <span
                                key={item.key}
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                    item.done ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-zinc-50 border-zinc-200 text-zinc-600"
                                }`}
                            >
                                {item.done ? "✓" : "•"} {item.label}
                            </span>
                        ))}
                    </div>
                    {showValidationPanel && validationIssues.length > 0 && (
                        <div className="mt-4 p-3 rounded-lg border border-amber-200 bg-amber-50">
                            <p className="text-xs font-semibold text-amber-900 mb-2">Fix these before preview:</p>
                            <div className="space-y-2">
                                {validationIssues.map((issue) => (
                                    <div key={issue.key} className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-amber-900">{issue.label}</span>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentTab(issue.tab)}
                                            className="px-2 py-1 rounded border border-amber-300 text-amber-900 text-xs hover:bg-amber-100"
                                        >
                                            Go to {issue.tab}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                                onChange={e => setConfig({ ...config, title: normalizeArrowText(e.target.value) })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="My Amazing Trip • June 2025"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Footer Text</label>
                            <input
                                type="text"
                                value={config.footer}
                                onChange={e => setConfig({ ...config, footer: normalizeArrowText(e.target.value) })}
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

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">Cover Image URL (optional)</label>
                            <input
                                type="url"
                                value={config.cover || ''}
                                onChange={e => setConfig({ ...config, cover: e.target.value || null })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://example.com/cover.jpg"
                            />
                        </div>
                    </div>
                )}

                {currentTab === 'flights' && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg p-5 shadow-sm border border-zinc-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-zinc-900">Flights</h2>
                                <span className="text-xs text-zinc-500">{flights.length} flight{flights.length === 1 ? "" : "s"}</span>
                            </div>
                            <p className="text-sm text-zinc-600">
                                Add where you’re flying from and to. Extra airline fields are optional.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={addFlight}
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                                >
                                    + Add Flight
                                </button>
                                <button
                                    onClick={addReturnFlight}
                                    className="px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-sm font-medium"
                                >
                                    + Add Return Flight
                                </button>
                            </div>
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
                                        value={flight.flightFrom || ""}
                                        onChange={e => updateFlight(index, 'flightFrom', e.target.value)}
                                        placeholder="From (city or airport)"
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={flight.flightTo || ""}
                                        onChange={e => updateFlight(index, 'flightTo', e.target.value)}
                                        placeholder="To (city or airport)"
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="date"
                                        value={flight.departureDate || ""}
                                        onChange={e => updateFlight(index, 'departureDate', e.target.value)}
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="time"
                                        value={flight.departureTime || ""}
                                        onChange={e => updateFlight(index, 'departureTime', e.target.value)}
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="time"
                                        value={flight.arrivalTime || ""}
                                        onChange={e => updateFlight(index, 'arrivalTime', e.target.value)}
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {flight.departureDate && (
                                    <div className="text-xs text-zinc-600 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2 flex items-center justify-between gap-2">
                                        {days.some((d) => d.isoDate === flight.departureDate) ? (
                                            <span>Linked to itinerary day on {formatIsoAsDisplayDate(flight.departureDate)}.</span>
                                        ) : (
                                            <>
                                                <span>No itinerary day exists for {formatIsoAsDisplayDate(flight.departureDate)}.</span>
                                                <button
                                                    type="button"
                                                    onClick={() => addTravelDayFromFlight(index)}
                                                    className="px-2 py-1 rounded border border-zinc-300 hover:bg-white text-xs font-medium"
                                                >
                                                    Create travel day
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                <details className="rounded-lg border border-zinc-200 p-3 bg-zinc-50">
                                    <summary className="cursor-pointer text-sm text-zinc-700 font-medium">More details (optional)</summary>
                                    <div className="grid md:grid-cols-2 gap-4 mt-3">
                                        <input
                                            type="text"
                                            value={flight.title || ""}
                                            onChange={e => updateFlight(index, 'title', e.target.value)}
                                            placeholder="Custom title"
                                            className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            value={flight.num || ""}
                                            onChange={e => updateFlight(index, 'num', e.target.value)}
                                            placeholder="Flight number (e.g. BA123)"
                                            className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            value={flight.codes || ""}
                                            onChange={e => updateFlight(index, 'codes', e.target.value)}
                                            placeholder="Airport codes (e.g. LHR → CDG)"
                                            className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </details>

                                <div className="text-xs text-zinc-500">
                                    Preview: {flight.route || "route pending"} {flight.date ? `• ${flight.date}` : ""} {flight.times ? `• ${flight.times}` : ""}
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
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedDaysByIndex((prev) => ({ ...prev, [index]: prev[index] === false }))}
                                            className="text-zinc-600 hover:text-zinc-900 text-sm font-medium"
                                        >
                                            {expandedDaysByIndex[index] === false ? "Expand" : "Collapse"}
                                        </button>
                                        <button
                                            onClick={() => removeDay(index)}
                                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                {expandedDaysByIndex[index] !== false && (
                                    <>
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
                                                onClick={() => setShowPhotoUrlInputByDay((prev) => ({ ...prev, [index]: true }))}
                                                className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800"
                                            >
                                                + Add URL
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Use "Find Photos" for automatic images. Add a manual URL only when needed.
                                    </p>
                                    {showPhotoUrlInputByDay[index] && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <input
                                                type="url"
                                                value={photoUrlDraftByDay[index] || ""}
                                                onChange={e => setPhotoUrlDraftByDay((prev) => ({ ...prev, [index]: e.target.value }))}
                                                placeholder="https://example.com/photo.jpg"
                                                className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => addPhotoUrlToDay(index)}
                                                className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
                                            >
                                                Add
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowPhotoUrlInputByDay((prev) => ({ ...prev, [index]: false }))}
                                                className="px-3 py-2 rounded-lg border border-zinc-300 text-sm font-medium hover:bg-zinc-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                    {(day.photos || []).filter(Boolean).length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-xs text-zinc-500 mb-2">Photo preview</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {(day.photos || [])
                                                    .map((photoUrl, photoIndex) => ({ photoUrl, photoIndex }))
                                                    .filter(({ photoUrl }) => String(photoUrl || "").trim() !== "")
                                                    .slice(0, 4)
                                                    .map(({ photoUrl, photoIndex }) => (
                                                        <div key={`${index}-preview-${photoIndex}`} className="relative">
                                                            <img
                                                                src={photoUrl}
                                                                alt=""
                                                                loading="lazy"
                                                                className="w-full h-24 object-cover rounded-lg border border-zinc-200 bg-zinc-100"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeDayPhoto(index, photoIndex)}
                                                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/65 text-white text-xs hover:bg-black/80"
                                                                aria-label="Remove photo"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                    {(day.photos || []).filter(Boolean).length === 0 && (
                                        <p className="text-sm text-zinc-500 italic mt-3">No photos added yet.</p>
                                    )}
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
                                            onChange={(e) => fetchPinSuggestions(index, e.target.value)}
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
                                    {pinSuggestLoadingByDay[index] && (
                                        <p className="text-xs text-zinc-500 mb-2">Searching places...</p>
                                    )}
                                    {(pinSuggestionsByDay[index] || []).length > 0 && (
                                        <div className="mb-3 rounded-lg border border-zinc-200 bg-white overflow-hidden">
                                            {(pinSuggestionsByDay[index] || []).map((row, rowIndex) => (
                                                <button
                                                    key={`${row.name}-${rowIndex}`}
                                                    type="button"
                                                    onClick={() => addPinFromSuggestion(index, row)}
                                                    className="w-full text-left px-3 py-2 hover:bg-zinc-50 border-b border-zinc-100 last:border-b-0"
                                                >
                                                    <p className="text-sm font-medium text-zinc-800">{row.name}</p>
                                                    <p className="text-xs text-zinc-500 truncate">{row.query}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

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

                                    <div className="mt-4 border-t border-zinc-200 pt-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-zinc-700">Calendar Badges</label>
                                            <span className="text-xs text-zinc-500">Up to 3 per day</span>
                                        </div>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Optional: add quick emoji markers for calendar view.
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {(dayBadges[Number(day.id)] || []).length > 0 ? (
                                                (dayBadges[Number(day.id)] || []).map((b, badgeIdx) => (
                                                    <span key={`${day.id}-badge-${badgeIdx}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-sm">
                                                        <span>{b}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeBadgeFromDay(day, badgeIdx)}
                                                            className="text-zinc-500 hover:text-red-600"
                                                            aria-label="Remove badge"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))
                                            ) : (
                                                <p className="text-sm text-zinc-500 italic">No badges yet.</p>
                                            )}
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {COMMON_BADGES.map((emoji) => (
                                                <button
                                                    key={`${day.id}-${emoji}`}
                                                    type="button"
                                                    onClick={() => addBadgeToDay(day, emoji)}
                                                    className="px-2.5 py-1.5 rounded-lg border border-zinc-300 text-sm hover:bg-zinc-50"
                                                    aria-label={`Add ${emoji} badge`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={badgeInputByDay[index] || ""}
                                                onChange={(e) => setBadgeInputByDay((prev) => ({ ...prev, [index]: e.target.value }))}
                                                placeholder="Custom emoji"
                                                className="w-40 px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    addBadgeToDay(day, badgeInputByDay[index]);
                                                    setBadgeInputByDay((prev) => ({ ...prev, [index]: "" }));
                                                }}
                                                className="px-3 py-2 rounded-lg border border-zinc-300 text-sm font-medium hover:bg-zinc-50"
                                            >
                                                Add Badge
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                    </>
                                )}
                            </div>
                        ))}

                        {days.length === 0 && (
                            <div className="bg-white rounded-lg p-12 shadow-sm text-center text-zinc-500">
                                No days added yet. Click "Add Day" to start building your itinerary.
                            </div>
                        )}
                    </div>
                )}

                {isAdmin && currentTab === 'JSON (Advanced)' && (
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
