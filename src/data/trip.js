import { mapDir } from "../utils/maps";

// ============================================================================
// TRIP CONFIGURATION
// ============================================================================
export const tripConfig = {
    title: "Portugal City Escape • 12-17 Apr 2026",
    footer: "Portugal Spring Getaway",
    favicon: "/favicon.png",
    calendar: {
        year: 2026,
        month: 3,
    },
    badgeLegend: [
        { emoji: "✈️", label: "Flight" },
        { emoji: "🚆", label: "Train" },
        { emoji: "🏛️", label: "Landmark" },
        { emoji: "🍷", label: "Food & Drink" },
        { emoji: "🌅", label: "Scenic" },
    ]
};

// ============================================================================
// COLOR PALETTE
// ============================================================================
export const palette = {
    bg: "from-orange-100 via-amber-50 to-rose-50",
    date: "bg-orange-600 text-white",
    day: "bg-emerald-700 text-white",
    note: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    card: "bg-white/90 border border-zinc-200 shadow-sm",
    route: "bg-blue-600 text-white",
    pin: "bg-zinc-900 text-white",
};

// ============================================================================
// LOCATION COORDINATES
// ============================================================================
export const ll = {
    JFK: [40.6413, -73.7781],
    LIS: [38.7742, -9.1342],
    OPO: [41.2421, -8.6786],
    "Lisbon Center": [38.7223, -9.1393],
    "Alfama": [38.7111, -9.1303],
    "Belem Tower": [38.6916, -9.2160],
    "Sintra": [38.8029, -9.3817],
    "Cascais": [38.6968, -9.4215],
    "Sao Bento Station": [41.1456, -8.6109],
    "Ribeira": [41.1412, -8.6110],
    "Vila Nova de Gaia": [41.1332, -8.6174],
    "Douro Valley": [41.1621, -7.7899],
};

// ============================================================================
// FLIGHTS
// ============================================================================
export const flights = [
    {
        title: "Flight out",
        num: "TP210",
        route: "New York (JFK) → Lisbon",
        date: "Sun, 12 Apr 2026",
        times: "19:10 → 07:10",
        codes: "JFK → LIS"
    },
    {
        title: "Flight home",
        num: "TP209",
        route: "Porto → New York (JFK)",
        date: "Fri, 17 Apr 2026",
        times: "16:20 → 19:00",
        codes: "OPO → JFK"
    },
];

// ============================================================================
// DAILY ITINERARY
// ============================================================================
export const days = [
    {
        id: "12",
        dow: "Sun",
        date: "12 Apr",
        title: "Flight out: New York -> Lisbon",
        photoQ: "night flight travel",
        photos: [
            "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80"
        ],
        hasMap: false,
        route: mapDir("JFK Airport", "Lisbon Airport"),
        pins: [
            { name: "JFK", q: "John F. Kennedy International Airport", ll: ll.JFK },
            { name: "LIS", q: "Lisbon Airport", ll: ll.LIS }
        ],
        notes: ["Evening departure", "Overnight flight"],
    },
    {
        id: "13",
        dow: "Mon",
        date: "13 Apr",
        title: "Lisbon old town: Alfama + viewpoints",
        photoQ: "Lisbon tram alfama",
        photos: [
            "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1200&q=80"
        ],
        hasMap: true,
        route: mapDir("Lisbon Center", "Alfama", ["Miradouro de Santa Luzia"]),
        pins: [
            { name: "Lisbon Center", q: "Baixa Lisbon", ll: ll["Lisbon Center"] },
            { name: "Alfama", q: "Alfama Lisbon", ll: ll["Alfama"] },
        ],
        notes: ["Hotel check-in", "Sunset viewpoint walk", "Pastel de nata stop"],
    },
    {
        id: "14",
        dow: "Tue",
        date: "14 Apr",
        title: "Day trip: Sintra and Cascais",
        photoQ: "Sintra Portugal palace",
        photos: [
            "https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=1200&q=80"
        ],
        hasMap: true,
        route: mapDir("Lisbon Center", "Cascais", ["Sintra"]),
        pins: [
            { name: "Sintra", q: "Sintra", ll: ll["Sintra"] },
            { name: "Cascais", q: "Cascais", ll: ll["Cascais"] },
        ],
        notes: ["Early train", "Palace visit", "Seafood dinner by the coast"],
        highlight: true,
    },
    {
        id: "15",
        dow: "Wed",
        date: "15 Apr",
        title: "Lisbon -> Porto and riverside evening",
        photoQ: "Porto Portugal ribeira",
        photos: [
            "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80"
        ],
        hasMap: true,
        route: mapDir("Lisbon Center", "Sao Bento Station"),
        pins: [
            { name: "Sao Bento Station", q: "Sao Bento Station Porto", ll: ll["Sao Bento Station"] },
            { name: "Ribeira", q: "Ribeira Porto", ll: ll["Ribeira"] },
        ],
        notes: ["Morning train to Porto", "Ribeira walk", "Bridge viewpoints"],
    },
    {
        id: "16",
        dow: "Thu",
        date: "16 Apr",
        title: "Douro Valley tasting day",
        photoQ: "Douro Valley vineyards",
        photos: [
            "https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?auto=format&fit=crop&w=1200&q=80"
        ],
        hasMap: true,
        route: mapDir("Porto", "Douro Valley", ["Vila Nova de Gaia"]),
        pins: [
            { name: "Vila Nova de Gaia", q: "Vila Nova de Gaia", ll: ll["Vila Nova de Gaia"] },
            { name: "Douro Valley", q: "Douro Valley", ll: ll["Douro Valley"] },
        ],
        notes: ["River cruise", "Cellar tasting", "Golden hour overlook"],
    },
    {
        id: "17",
        dow: "Fri",
        date: "17 Apr",
        title: "Fly home: Porto -> New York",
        photoQ: "airport departure",
        photos: [
            "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80"
        ],
        hasMap: false,
        route: mapDir("Porto", "Porto Airport"),
        pins: [
            { name: "OPO", q: "Porto Airport", ll: ll.OPO },
            { name: "JFK", q: "John F. Kennedy International Airport", ll: ll.JFK }
        ],
        notes: ["Last coffee in Porto", "Afternoon departure"],
    },
];

// ============================================================================
// CALENDAR DAY BADGES
// ============================================================================
export const dayBadges = {
    12: ["✈️"],
    13: ["🏛️"],
    14: ["🌅"],
    15: ["🚆"],
    16: ["🍷"],
    17: ["✈️"],
};
