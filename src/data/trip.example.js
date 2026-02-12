import { mapDir } from "../utils/maps";

// ============================================================================
// TRIP CONFIGURATION
// ============================================================================
export const tripConfig = {
    title: "My Trip • 1–7 Jun 2025",
    footer: "Adventure Time! 🌍",
    favicon: null,  // or add a URL to an image
    calendar: {
        year: 2025,
        month: 5,  // 0=January, 11=December
    },
    badgeLegend: [
        { emoji: "✈️", label: "Flight" },
        { emoji: "🏨", label: "Hotel" },
    ]
};

// ============================================================================
// COLOR PALETTE
// ============================================================================
export const palette = {
    bg: "from-blue-100 via-cyan-50 to-teal-50",
    date: "bg-fuchsia-600 text-white",
    day: "bg-teal-600 text-white",
    note: "bg-blue-50 text-blue-800 border border-blue-200",
    card: "bg-white/90 border border-zinc-200 shadow-sm",
    route: "bg-blue-600 text-white",
    pin: "bg-zinc-900 text-white",
};

// ============================================================================
// LOCATION COORDINATES
// ============================================================================
export const ll = {
    "City A": [40.7128, -74.0060],  // Example: New York
    "City B": [51.5074, -0.1278],   // Example: London
};

// ============================================================================
// FLIGHTS
// ============================================================================
export const flights = [
    {
        title: "Outbound",
        num: "AA100",
        route: "City A → City B",
        date: "Sat, 1 Jun 2025",
        times: "10:00 → 22:00",
        codes: "JFK → LHR"
    },
];

// ============================================================================
// DAILY ITINERARY
// ============================================================================
export const days = [
    {
        id: "1",
        dow: "Sat",
        date: "1 Jun",
        title: "Arrival Day",
        photoQ: "city skyline",
        photos: [],
        hasMap: false,
        route: mapDir("Airport", "Hotel"),
        pins: [
            { name: "Airport", q: "City B Airport", ll: ll["City B"] }
        ],
        notes: ["Check in at hotel", "Dinner nearby"],
    },
    // Add more days here...
];

// ============================================================================
// CALENDAR DAY BADGES
// ============================================================================
export const dayBadges = {
    1: ['✈️'],
    2: ['🏨'],
};
