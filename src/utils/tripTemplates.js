export const QUICK_TEMPLATES = [
  {
    id: "city",
    emoji: "🏙️",
    title: "City Break",
    description: "Museums, cafes, neighborhoods",
    cover: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "beach",
    emoji: "🏖️",
    title: "Beach Week",
    description: "Relaxed days by the coast",
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "road",
    emoji: "🚗",
    title: "Road Trip",
    description: "Multi-stop adventure",
    cover: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "family",
    emoji: "👨‍👩‍👧‍👦",
    title: "Family Trip",
    description: "Kid-friendly pace and plans",
    cover: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=80",
  },
];

export function buildTemplateTrip(templateId, paletteValue) {
  const map = {
    city: {
      tripConfig: {
        title: "City Break",
        footer: "48 hours in the city",
        favicon: null,
        cover: QUICK_TEMPLATES[0].cover,
        calendar: { year: 2026, month: 4 },
        badgeLegend: [{ emoji: "🏛️", label: "Culture" }, { emoji: "🍽️", label: "Food" }],
      },
      flights: [],
      days: [
        { id: "10", isoDate: "2026-05-10", dow: "Sun", date: "10 May", title: "Arrival + old town walk", photos: [], hasMap: false, route: "", pins: [], notes: ["Hotel check-in", "Sunset viewpoint"] },
        { id: "11", isoDate: "2026-05-11", dow: "Mon", date: "11 May", title: "Museums + food market", photos: [], hasMap: false, route: "", pins: [], notes: ["Museum in the morning", "Market lunch"] },
        { id: "12", isoDate: "2026-05-12", dow: "Tue", date: "12 May", title: "Departure", photos: [], hasMap: false, route: "", pins: [], notes: ["Brunch", "Airport transfer"] },
      ],
      dayBadges: { 10: ["🏛️"], 11: ["🍽️"] },
      ll: {},
      palette: paletteValue,
    },
    beach: {
      tripConfig: {
        title: "Beach Week",
        footer: "Sun, swim, repeat",
        favicon: null,
        cover: QUICK_TEMPLATES[1].cover,
        calendar: { year: 2026, month: 6 },
        badgeLegend: [{ emoji: "🏖️", label: "Beach" }, { emoji: "🌅", label: "Sunset" }],
      },
      flights: [],
      days: [
        { id: "6", isoDate: "2026-07-06", dow: "Mon", date: "6 Jul", title: "Arrival + beach sunset", photos: [], hasMap: false, route: "", pins: [], notes: ["Check-in", "Golden hour swim"] },
        { id: "7", isoDate: "2026-07-07", dow: "Tue", date: "7 Jul", title: "Boat day", photos: [], hasMap: false, route: "", pins: [], notes: ["Snorkel stop", "Beach dinner"] },
        { id: "8", isoDate: "2026-07-08", dow: "Wed", date: "8 Jul", title: "Departure", photos: [], hasMap: false, route: "", pins: [], notes: ["Slow morning", "Checkout"] },
      ],
      dayBadges: { 6: ["🏖️"], 7: ["🌅"] },
      ll: {},
      palette: paletteValue,
    },
    road: {
      tripConfig: {
        title: "Road Trip",
        footer: "Drive, stop, explore",
        favicon: null,
        cover: QUICK_TEMPLATES[2].cover,
        calendar: { year: 2026, month: 8 },
        badgeLegend: [{ emoji: "🚗", label: "Drive" }, { emoji: "⛰️", label: "Scenic" }],
      },
      flights: [],
      days: [
        { id: "2", isoDate: "2026-09-02", dow: "Wed", date: "2 Sep", title: "Pickup + first leg", photos: [], hasMap: true, route: "", pins: [], notes: ["Collect car", "Scenic stop"] },
        { id: "3", isoDate: "2026-09-03", dow: "Thu", date: "3 Sep", title: "Mountain loop", photos: [], hasMap: true, route: "", pins: [], notes: ["Coffee stop", "Hike"] },
        { id: "4", isoDate: "2026-09-04", dow: "Fri", date: "4 Sep", title: "Final city + return", photos: [], hasMap: true, route: "", pins: [], notes: ["City lunch", "Return car"] },
      ],
      dayBadges: { 2: ["🚗"], 3: ["⛰️"] },
      ll: {},
      palette: paletteValue,
    },
    family: {
      tripConfig: {
        title: "Family Trip",
        footer: "Fun at a comfortable pace",
        favicon: null,
        cover: QUICK_TEMPLATES[3].cover,
        calendar: { year: 2026, month: 3 },
        badgeLegend: [{ emoji: "🎡", label: "Activities" }, { emoji: "🍽️", label: "Family meal" }],
      },
      flights: [],
      days: [
        { id: "18", isoDate: "2026-04-18", dow: "Sat", date: "18 Apr", title: "Arrival + easy afternoon", photos: [], hasMap: false, route: "", pins: [], notes: ["Hotel pool", "Early dinner"] },
        { id: "19", isoDate: "2026-04-19", dow: "Sun", date: "19 Apr", title: "Main activity day", photos: [], hasMap: false, route: "", pins: [], notes: ["Theme park morning", "Nap break"] },
        { id: "20", isoDate: "2026-04-20", dow: "Mon", date: "20 Apr", title: "Departure", photos: [], hasMap: false, route: "", pins: [], notes: ["Pack slowly", "Airport"] },
      ],
      dayBadges: { 19: ["🎡"] },
      ll: {},
      palette: paletteValue,
    },
  };
  return map[templateId] || null;
}

export function getTemplateJson(paletteValue) {
  return JSON.stringify({
    tripConfig: {
      title: "Portugal City Escape",
      footer: "Spring city break",
      favicon: "https://example.com/favicon.png",
      cover: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
      calendar: { year: 2026, month: 3 },
      badgeLegend: [{ emoji: "✈️", label: "Flight" }, { emoji: "🚆", label: "Train" }]
    },
    flights: [
      { title: "Flight Out", num: "TP210", route: "JFK → LIS", date: "Sun, 12 Apr 2026", times: "19:10 → 07:10", codes: "JFK → LIS" }
    ],
    days: [
      {
        id: "12",
        dow: "Sun",
        date: "12 Apr",
        title: "Arrival in Lisbon",
        photos: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957"],
        hasMap: true,
        pins: [{ name: "Lisbon Airport", q: "Lisbon Airport", ll: [38.7742, -9.1342] }],
        notes: ["Airport transfer", "Hotel check-in"]
      }
    ],
    ll: {
      "Lisbon Airport": [38.7742, -9.1342]
    },
    palette: paletteValue,
  }, null, 2);
}
