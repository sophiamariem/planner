import { mapDir } from "../utils/maps";

// ============================================================================
// TRIP CONFIGURATION
// ============================================================================
// Customize these values for your own trip!
export const tripConfig = {
    // Trip title shown in header
    title: "Cyprus Trip • 15–24 Sep 2025",

    // Footer text
    footer: "Cyprus ☀️ Sept 2025",

    // Favicon URL (or set to null for default)
    favicon: "https://www.worldtravelguide.net/wp-content/uploads/2017/04/Think-Cyprus-AyiaNapa-514991484-Kirillm-copy.jpg",

    // Calendar display settings (month is 0-indexed: 0=Jan, 8=Sep, etc.)
    calendar: {
        year: 2025,
        month: 8,  // 0=January, 8=September
    },

    // Calendar badge legend (emoji explanations shown below calendar)
    badgeLegend: [
        { emoji: "✈️", label: "Flight" },
        { emoji: "🎂", label: "Birthday" },
        { emoji: "🚗", label: "Drive" },
        { emoji: "🛥️", label: "Boat" },
        { emoji: "💍", label: "Wedding" },
        { emoji: "🏖️", label: "Beach" },
        { emoji: "⚓️", label: "Marina" },
        { emoji: "🌅", label: "Sunset" },
    ]
};

// ============================================================================
// COLOR PALETTE
// ============================================================================
// Customize the look & feel of your planner with Tailwind CSS classes
export const palette = {
    bg: "from-pink-100 via-rose-50 to-amber-50",
    date: "bg-fuchsia-600 text-white",
    day: "bg-sky-600 text-white",
    note: "bg-teal-50 text-teal-800 border border-teal-200",
    card: "bg-white/90 border border-zinc-200 shadow-sm",
    route: "bg-blue-600 text-white",
    pin: "bg-zinc-900 text-white",
};

// ============================================================================
// LOCATION COORDINATES (for maps)
// ============================================================================
// Add lat/lng coordinates for all locations you'll visit
// Format: "Location Name": [latitude, longitude]
export const ll = {
    Paphos: [34.772, 32.429],
    "Coral Bay Beach": [34.857, 32.372],
    "Paphos Harbour": [34.756, 32.414],
    Omodos: [34.806, 32.806],
    "Kykkos Monastery": [34.974, 32.714],
    Kalopanayiotis: [35.005, 32.839],
    Kakopetria: [34.987, 32.906],
    "Latchi Harbour": [35.041, 32.414],
    "Blue Lagoon": [35.079, 32.255],
    Lefkara: [34.869, 33.302],
    "Nissi Beach": [34.988, 33.97],
    "Cape Greco": [34.95, 34.05],
    "Fig Tree Bay": [35.017, 34.061],
    Protaras: [35.012, 34.058],
    "Konnos Bay": [34.98, 34.075],
    "Makronissos Beach": [34.986, 33.944],
    "Sea Caves": [34.887, 32.317],
    "White River Beach": [35.017, 32.289],
    "Secret Olive Beach": [34.933, 32.388],
    "Limassol Marina": [34.67, 33.043],
    "Governor's Beach": [34.712, 33.286],
    PFO: [34.717, 32.485],
    STN: [51.885, 0.235],
};

// ============================================================================
// FLIGHTS
// ============================================================================
// Optional: Add your flight information
export const flights = [
    { title: "Flight out", num: "FR3131", route: "London (Stansted) → Paphos", date: "Mon, 15 Sep 2025", times: "18:35 → 01:00", codes: "STN → PFO" },
    { title: "Flight back", num: "FR3132", route: "Paphos → London (Stansted)", date: "Wed, 24 Sep 2025", times: "05:50 → 08:35", codes: "PFO → STN" },
];

// ============================================================================
// DAILY ITINERARY
// ============================================================================
// Each day object contains:
//   - id: day number (string)
//   - dow: day of week abbreviation
//   - date: formatted date string
//   - title: headline for the day
//   - photoQ: Unsplash search query (fallback if photos array is empty)
//   - photos: array of photo URLs
//   - hasMap: boolean - show route map on card?
//   - route: Google Maps directions URL (use mapDir helper)
//   - pins: array of location markers {name, q (search query), ll (coordinates)}
//   - notes: array of bullet points
//   - highlight: optional boolean for special styling
export const days = [
    {
        id: "15",
        dow: "Mon",
        date: "15 Sep",
        title: "Flight out: London → Paphos",
        photoQ: "London",
        photos: [
            "https://media.istockphoto.com/id/155439315/photo/passenger-airplane-flying-above-clouds-during-sunset.jpg?s=612x612&w=0&k=20&c=LJWadbs3B-jSGJBVy9s0f8gZMHi2NvWFXa3VJ2lFcL0="
        ],
        hasMap: false,
        route: mapDir("London Stansted (STN)", "Paphos (PFO)"),
        pins: [
            { name: "STN", q: "London Stansted Airport", ll: ll.STN },
            { name: "PFO", q: "Paphos International Airport", ll: ll.PFO }
        ],
        notes: ["18:35 Departure"],
    },
    {
        id: "16",
        dow: "Tue",
        date: "16 Sep",
        title: "Family time • Coral Bay",
        photoQ: "Paphos Cyprus",
        photos: [
            "https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcQmaKgIGNe6yxC-ZPCV988NP1JM5d8jC5IiynIOKPEEJqSjoMAVGaenTXqJeqk7ebi8DAHsFyeG2udybViTlQEFJOXmGSvaD79ylVVWxw",
            "https://www.sovereign.com/-/media/Bynder/Sovereign-destinations/Cyprus/Paphos/Paphos-2023-Panoramic-View-Pahos-000882-1416276530-Hybris.jpg?rev=fb379dab4c2847da9a44841a0579cc29&hash=97B77ECD651496CE906841C25A4B97BD&h=480.375&w=1081.5"
        ],
        hasMap: false,
        route: mapDir("Paphos", "Coral Bay Beach"),
        pins: [
            { name: "Paphos", q: "Paphos", ll: ll.Paphos },
            { name: "Coral Bay Beach", q: "Coral Bay Beach Cyprus", ll: ll["Coral Bay Beach"] },
            { name: "Paphos Harbour", q: "Paphos Harbour", ll: ll["Paphos Harbour"] },
        ],
        notes: ["Family hellos", "Beach", "gelato"],
    },
    {
        id: "17",
        dow: "Wed",
        date: "17 Sep",
        title: "Troodos loop: Omodos • Kykkos • Kalopanayiotis • Kakopetria",
        photoQ: "Troodos mountains Cyprus village stone",
        photos: [
            "https://everythingayianapa.com/wp-content/uploads/2023/03/Limassol-Onodos-Village-Winery-3.jpg",
            "https://estateofcyprus.com/wp-content/uploads/2025/05/landscape-3654326_1280.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaksMMGz46_aJ0VLNKS1CsRV1GMW7NMm9HKw&s"
        ],
        hasMap: true,
        route: mapDir("Paphos", "Paphos", ["Omodos", "Kykkos Monastery", "Kalopanayiotis", "Kakopetria"]),
        pins: [
            { name: "Paphos (start)", q: "Paphos", ll: ll.Paphos },
            { name: "Omodos", q: "Omodos village", ll: ll.Omodos },
            { name: "Kykkos Monastery", q: "Kykkos Monastery", ll: ll["Kykkos Monastery"] },
            { name: "Kalopanayiotis", q: "Kalopanayiotis", ll: ll.Kalopanayiotis },
            { name: "Kakopetria", q: "Kakopetria", ll: ll.Kakopetria }
        ],
        notes: ["Coffee + strolls", "Scenic drives"]
    },
    {
        id: "18",
        dow: "Thu",
        date: "18 Sep",
        title: "Birthday splash: Blue Lagoon day • Family night",
        photoQ: "Blue Lagoon Akamas Cyprus boat",
        photos: [
            "https://media.tacdn.com/media/attractions-splice-spp-674x446/12/02/97/ed.jpg",
            "https://parade.com/.image/c_fill,w_1200,h_1200,g_faces:center/MjAzMzU3NzQxMzU4NTIzOTgz/happy-birthday-wishes-messages.jpg"
        ],
        hasMap: false,
        route: mapDir("Paphos", "Latchi Harbour"),
        pins: [
            { name: "Latchi Harbour", q: "Latchi Harbour", ll: ll["Latchi Harbour"] },
            { name: "Blue Lagoon", q: "Blue Lagoon Cyprus Akamas", ll: ll["Blue Lagoon"] }
        ],
        notes: ["Boat + swim", "Dinner at home"],
        highlight: true
    },
    {
        id: "19",
        dow: "Fri",
        date: "19 Sep",
        title: "Lefkara • Nissi • Makronissos • Cape Greco → Ayia Napa stay",
        photoQ: "Ayia Napa Nissi Beach Cyprus",
        photos: [
            "https://www.agrotourism.com.cy/sites/default/files/2021-06/lefkara_0.png",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4TjkXH4aiVd-acRTjUGha0tzaLzNwAovdRw&s",
            "https://chooseyourcyprus.com/wp-content/themes/yootheme/cache/88/CAPE-GKREKO-88083238.jpeg"
        ],
        hasMap: true,
        route: mapDir("Paphos", "Protaras", ["Lefkara", "Nissi Beach", "Cape Greco"]),
        pins: [
            { name: "Paphos (start)", q: "Paphos", ll: ll.Paphos },
            { name: "Lefkara", q: "Lefkara village", ll: ll.Lefkara },
            { name: "Nissi Beach", q: "Nissi Beach", ll: ll["Nissi Beach"] },
            { name: "Cape Greco", q: "Cape Greco", ll: ll["Cape Greco"] },
            { name: "Protaras (overnight)", q: "Protaras", ll: ll.Protaras }
        ],
        notes: [
            "Breakfast + quick wander in Lefkara",
            "Nissi: iconic vibe, shallow water",
            "Cape Greco for golden hour",
            "Overnight Ayia Napa or Protaras"
        ]
    },
    {
        id: "20",
        dow: "Sat",
        date: "20 Sep",
        title: " Konnos Bay • Fig Tree Bay • Makronissos → back to Paphos",
        photoQ: "Cyprus coastline beach",
        photos: [
            "https://www.loveayianapa.com/uploads/5/9/6/3/5963822/konnos-4.jpg",
            "https://content.r9cdn.net/rimg/dimg/3f/ff/d7aa5ad8-lm-44596-16bdc8eb50f.jpg?width=1366&height=768&xhint=1839&yhint=1710&crop=true&watermarkposition=lowerright",
            "https://mycyprustravel.com/wp-content/uploads/2018/06/Macronissos-Beach.jpg",
        ],
        hasMap: false,
        route: mapDir("Protaras", "Paphos", ["Konnos Bay", "Fig Tree Bay", "Makronissos Beach"]),
        pins: [
            { name: "Konnos Bay", q: "Konnos Bay", ll: ll["Konnos Bay"] },
            { name: "Fig Tree Bay", q: "Fig Tree Bay", ll: ll["Fig Tree Bay"] },
            { name: "Makronissos Beach", q: "Makronissos Beach", ll: ll["Makronissos Beach"] },
            { name: "Paphos", q: "Paphos", ll: ll.Paphos }
        ],
        notes: [
            "Beach",
            "Konnos Bay: turquoise cove",
            "Fig Tree Bay: iconic beach",
            "Makronissos: calmer contrast",
            "Late drive back"]
    },
    {
        id: "21",
        dow: "Sun",
        date: "21 Sep",
        title: "Jesse’s wedding",
        photoQ: "mediterranean wedding outdoor",
        photos: [
            "https://onefabday.com/wp-content/uploads/2020/01/Destination-Weddings-in-Cyprus.jpg"
        ],
        hasMap: false,
        route: mapDir("Peyia", "Peyia"),
        pins: [{ name: "Peyia", q: "Peyia", ll: ll.Paphos }],
        notes: ["Wedding day"]
    },
    {
        id: "22",
        dow: "Mon",
        date: "22 Sep",
        title: "Sea Caves • White River Beach • Olive Tree Beach",
        photoQ: "Paphos sea caves",
        photos: [
            "https://finduslost.com/wp-content/uploads/2018/10/Cyprus-Travel-Guide-Find-Us-Lost-01594.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvzR9DncAP604ZauYrIRRdViMzGv5atBfy1Q&s",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQZ0hxp8X8Z7OFdujYWSKcTWlRYyXNm871mA&s"
        ],
        hasMap: false,
        route: mapDir("Paphos", "Paphos", ["Sea Caves Paphos", "White River Beach", "Olive Tree Beach"]),
        pins: [
            { name: "Oniro by the Sea", q: "Oniro by the Sea", ll: ll["Oniro"] },
            { name: "Sea Caves", q: "Paphos Sea Caves", ll: ll["Sea Caves"] },
            { name: "Secret Olive Beach", q: "Secret Olive Beach Cyprus", ll: ll["Secret Olive Beach"] },
            { name: "White River Beach", q: "White River Beach Cyprus", ll: ll["White River Beach"] }
        ],
        notes: ["Swim spots", "Sunset"]
    },
    {
        id: "23",
        dow: "Tue",
        date: "23 Sep",
        title: "Limassol Marina • Governor’s Beach • Koureion",
        photoQ: "Limassol Marina Cyprus",
        photos: [
            "https://www.limassolmarina.com/storage/app/media/Homepage/images/heroplaceholder.jpg",
            "https://images.musement.com/cover/0153/23/thumb_15222835_cover_header.jpg"
        ],
        hasMap: false,
        route: mapDir("Paphos", "Governor's Beach", ["Limassol Marina", "Koureion"]),
        pins: [
            { name: "Limassol Marina", q: "Limassol Marina", ll: ll["Limassol Marina"] },
            { name: "Governor's Beach", q: "Governor's Beach Cyprus", ll: ll["Governor's Beach"] },
            { name: "Koureion", q: "Koureion", ll: ll["Koureion"] }
        ],
        notes: ["Stroll + lunch", "Amphitheatre"]
    },
    {
        id: "24",
        dow: "Wed",
        date: "24 Sep",
        title: "Fly home: Paphos → London",
        photoQ: "London skyline",
        photos: [
            "https://cdn.theatlantic.com/media/img/photo/2017/01/a-dizzying-view-of-london/01JasonHawkes-0753-1/original.jpg"
        ],
        hasMap: false,
        route: mapDir("Paphos (PFO)", "London Stansted (STN)"),
        pins: [
            { name: "PFO", q: "Paphos International Airport", ll: ll.PFO },
            { name: "STN", q: "London Stansted Airport", ll: ll.STN }
        ],
        notes: ["05:50 departure"]
    }
];

// ============================================================================
// CALENDAR DAY BADGES
// ============================================================================
// Add emoji badges to calendar days (shows on calendar view)
// Format: dayNumber: ['emoji1', 'emoji2', ...]
export const dayBadges = { 15: ['✈️'], 16: ['🏖️'], 17: ['🚗','⛰️'], 18: ['🎂','🛥️'], 19: ['🚗','🏝️'], 20: ['🏖️'], 21: ['💍'], 22: ['🌅'], 23: ['⚓️'], 24: ['✈️'] };
