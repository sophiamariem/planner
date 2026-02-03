import React, { useState, useEffect } from 'react';
import { palette } from '../data/trip';

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
    const [currentTab, setCurrentTab] = useState('basic');
    const [jsonInput, setJsonInput] = useState(JSON.stringify(tripData || {}, null, 2));
    const [jsonError, setJsonError] = useState("");

    // Auto-save to localStorage (but don't trigger preview)
    useEffect(() => {
        const autoSaveTimer = setTimeout(() => {
            const tripData = { tripConfig: config, days, flights, ll: locations, palette, dayBadges: {} };
            // Just save to localStorage, don't call onSave which would exit builder mode
            localStorage.setItem('current-trip', JSON.stringify(tripData));
        }, 1000);
        return () => clearTimeout(autoSaveTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config, days, flights, locations]);

    const addDay = () => {
        const newDay = {
            id: String(days.length + 1),
            dow: "Mon",
            date: "",
            title: "New Day",
            photoQ: "",
            photos: [],
            hasMap: false,
            route: "",
            pins: [],
            notes: [],
        };
        setDays([...days, newDay]);
    };

    const updateDay = (index, field, value) => {
        const updated = [...days];
        updated[index] = { ...updated[index], [field]: value };
        setDays(updated);
    };

    const removeDay = (index) => {
        setDays(days.filter((_, i) => i !== index));
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
            // Basic validation
            if (parsed.tripConfig && Array.isArray(parsed.days) && Array.isArray(parsed.flights)) {
                setConfig(parsed.tripConfig);
                setDays(parsed.days);
                setFlights(parsed.flights);
                setLocations(parsed.ll || {});
                setJsonError("");
                alert("JSON imported successfully!");
            } else {
                setJsonError("Invalid trip data structure. Please ensure tripConfig, days, and flights are present.");
            }
        } catch (e) {
            setJsonError("Invalid JSON format. Please check your syntax.");
        }
    };

    const updateJsonFromState = () => {
        const currentTripData = { tripConfig: config, days, flights, ll: locations, palette, dayBadges: {} };
        setJsonInput(JSON.stringify(currentTripData, null, 2));
    };

    return (
        <div className="min-h-screen bg-zinc-50">
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
                                onClick={() => onSave({ tripConfig: config, days, flights, ll: locations, palette, dayBadges: {} })}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                            >
                                Save & Preview
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 mt-4 overflow-x-auto">
                        {['basic', 'flights', 'days', 'locations', 'JSON (Advanced)'].map(tab => (
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

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Calendar Year</label>
                                <input
                                    type="number"
                                    value={config.calendar.year}
                                    onChange={e => setConfig({ ...config, calendar: { ...config.calendar, year: parseInt(e.target.value) } })}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Calendar Month</label>
                                <select
                                    value={config.calendar.month + 1}
                                    onChange={e => setConfig({ ...config, calendar: { ...config.calendar, month: parseInt(e.target.value) - 1 } })}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </select>
                            </div>
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
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900">Daily Itinerary</h2>
                            <button
                                onClick={addDay}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                            >
                                + Add Day
                            </button>
                        </div>

                        {days.map((day, index) => (
                            <div key={index} className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-zinc-900">Day {index + 1}</h3>
                                    <button
                                        onClick={() => removeDay(index)}
                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
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
                                        placeholder="Date (e.g. 15 Jun)"
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={day.id}
                                        onChange={e => updateDay(index, 'id', e.target.value)}
                                        placeholder="Day # (for calendar)"
                                        className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <input
                                    type="text"
                                    value={day.title}
                                    onChange={e => updateDay(index, 'title', e.target.value)}
                                    placeholder="Day title (e.g. Arrive in Paris)"
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />

                                <textarea
                                    value={day.notes.join('\n')}
                                    onChange={e => updateDay(index, 'notes', e.target.value.split('\n'))}
                                    placeholder="Notes (press Enter for new line)&#10;Example:&#10;Check in at hotel&#10;Dinner at 7pm&#10;Evening walk"
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                                />

                                <input
                                    type="text"
                                    value={day.photoQ}
                                    onChange={e => updateDay(index, 'photoQ', e.target.value)}
                                    placeholder="Photo search query (e.g. Paris Eiffel Tower)"
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />

                                <div className="border border-zinc-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-zinc-700">Photo URLs (optional)</label>
                                        <button
                                            type="button"
                                            onClick={() => addDayPhoto(index)}
                                            className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800"
                                        >
                                            + Add Photo URL
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Add one or more web image URLs. If provided, these override the search query above.
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
                                        <label className="text-sm font-medium text-zinc-700">Locations to Show on Map</label>
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

                                    {Object.keys(locations).length === 0 ? (
                                        <p className="text-sm text-zinc-500 italic">No locations added yet. Go to the "Locations" tab to add some.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(locations).map(locName => {
                                                const isSelected = day.pins?.some(p => p.name === locName) || false;
                                                return (
                                                    <button
                                                        key={locName}
                                                        type="button"
                                                        onClick={() => {
                                                            const currentPins = day.pins || [];
                                                            if (isSelected) {
                                                                // Remove pin
                                                                updateDay(index, 'pins', currentPins.filter(p => p.name !== locName));
                                                            } else {
                                                                // Add pin
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
                                    )}
                                    {day.pins && day.pins.length > 0 && (
                                        <p className="text-xs text-zinc-500 mt-2">
                                            Selected: {day.pins.map(p => p.name).join(', ')}
                                        </p>
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

                {currentTab === 'locations' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900">Location Coordinates</h2>
                            <button
                                onClick={() => {
                                    const newName = prompt("Location name:");
                                    if (newName) {
                                        setLocations({...locations, [newName]: [0, 0]});
                                    }
                                }}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
                            >
                                + Add Location
                            </button>
                        </div>

                        <p className="text-sm text-zinc-600">
                            Find coordinates at <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">latlong.net</a>
                        </p>

                        {Object.entries(locations).map(([name, coords]) => (
                            <div key={name} className="bg-white rounded-lg p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-zinc-900">{name}</h3>
                                    <button
                                        onClick={() => {
                                            const newLocs = {...locations};
                                            delete newLocs[name];
                                            setLocations(newLocs);
                                        }}
                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-2">Latitude</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={coords[0]}
                                            onChange={e => {
                                                const newLocs = {...locations};
                                                newLocs[name] = [parseFloat(e.target.value), coords[1]];
                                                setLocations(newLocs);
                                            }}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g. 48.8566"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-2">Longitude</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={coords[1]}
                                            onChange={e => {
                                                const newLocs = {...locations};
                                                newLocs[name] = [coords[0], parseFloat(e.target.value)];
                                                setLocations(newLocs);
                                            }}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g. 2.3522"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {Object.keys(locations).length === 0 && (
                            <div className="bg-white rounded-lg p-12 shadow-sm text-center text-zinc-500">
                                No locations added yet. Click "Add Location" to get started.
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
