# 🗺️ Trip Planner Template

A beautiful, interactive trip planning app built with React. Perfect for creating shareable itineraries for vacations, road trips, and adventures!

![Screenshot](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react)

## ✨ Features

- 📅 **Dual View Modes**: Switch between card-based timeline and calendar view
- 🗺️ **Interactive Maps**: Leaflet maps showing routes and locations
- 🖼️ **Photo Galleries**: Support for multiple photos per day with responsive layouts
- ✈️ **Flight Cards**: Dedicated flight information display
- 🔍 **Smart Filtering**: Search across days, locations, and notes
- 🎨 **Customizable Styling**: Easy color palette customization with Tailwind CSS
- 📱 **Mobile Responsive**: Works beautifully on all screen sizes
- 🖨️ **Print Support**: Generate printable itineraries

## 🚀 Quick Start

### For Your Own Trip

1. **Clone or fork this repository**
   ```bash
   git clone https://github.com/yourusername/trip-planner.git my-trip
   cd my-trip
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Customize your trip** (see [Customization Guide](#-customization-guide) below)

4. **Run locally**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view your planner

5. **Build for deployment**
   ```bash
   npm run build
   ```

## ☁️ Cloud Migration (Phase 1)

This app now supports an optional cloud mode while keeping the existing JSON workflow.

### What stays the same

- You can still start from template/scratch.
- You can still import JSON directly.
- URL-encoded and `public/itineraries/*.json` sharing still works.

### What is new

- Optional email magic-link sign in.
- Save/open trips from cloud (Supabase).
- Share links use short descriptive slugs: `#t=<slug>` (legacy `#cloud` / `#share` still supported).
- Slugs are generated from the trip title with a short unique suffix (example: `#t=tokyo-food-3k9a`).

### Setup

1. Copy env template:
   ```bash
   cp .env.example .env
   ```
2. Fill:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - Optional: `REACT_APP_UNSPLASH_ACCESS_KEY` (improves in-app "Find Photos")
3. Apply schema:
   - Option A (automated): set `SUPABASE_DB_URL` and run `npm run db:apply-schema`
   - Option B (manual): run `supabase/schema.sql` in Supabase SQL editor
4. Deploy as usual on Netlify.

Without env vars, the app runs in local-only mode (same behavior as before).

## 📱 Mobile App

Mobile docs moved to `apps/mobile/README.md` for a separate mobile workflow.

### Optional one-time import of existing static JSON itineraries

Use a service role key locally to seed your existing files from `public/itineraries`:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run import:itineraries
```

## 📝 Customization Guide

All trip data lives in one file: `src/data/trip.js`

### 1. Trip Configuration

Edit the `tripConfig` object at the top of `trip.js`:

```javascript
export const tripConfig = {
    title: "My Amazing Trip • June 2025",
    footer: "Adventure awaits! 🌍",
    favicon: "https://your-favicon-url.com/image.jpg",
    calendar: {
        year: 2025,
        month: 5,  // 0=January, 5=June, 11=December
    },
    badgeLegend: [
        { emoji: "✈️", label: "Flight" },
        { emoji: "🏖️", label: "Beach" },
        // Add your own badge types
    ]
};
```

### 2. Color Palette

Customize your planner's look with Tailwind CSS classes:

```javascript
export const palette = {
    bg: "from-blue-100 via-cyan-50 to-teal-50",  // Background gradient
    date: "bg-blue-600 text-white",              // Date badge
    day: "bg-teal-600 text-white",               // Day of week badge
    note: "bg-blue-50 text-blue-800 border border-blue-200",
    card: "bg-white/90 border border-zinc-200 shadow-sm",
    route: "bg-blue-600 text-white",             // Route button
    pin: "bg-zinc-900 text-white",               // Map pins
};
```

### 3. Location Coordinates

Add coordinates for all locations you'll visit (used for maps):

```javascript
export const ll = {
    "Paris": [48.8566, 2.3522],
    "Eiffel Tower": [48.8584, 2.2945],
    "Louvre Museum": [48.8606, 2.3376],
    // Find coordinates at https://www.latlong.net/
};
```

### 4. Flights (Optional)

```javascript
export const flights = [
    {
        title: "Outbound Flight",
        num: "BA123",
        route: "London → Paris",
        date: "Mon, 15 Jun 2025",
        times: "10:00 → 12:30",
        codes: "LHR → CDG"
    },
    // Add return flight
];
```

### 5. Daily Itinerary

This is where the magic happens! Each day is an object with:

```javascript
export const days = [
    {
        id: "15",                     // Day number (matches calendar date)
        dow: "Mon",                   // Day of week
        date: "15 Jun",               // Formatted date
        title: "Arrive in Paris",     // Day headline
        photos: [                     // Add your own URLs, or use "Find Photos" in the builder
            "https://image-url-1.jpg",
            "https://image-url-2.jpg"
        ],
        hasMap: true,                 // Show route map on card?
        route: mapDir("CDG Airport", "Hotel", ["Eiffel Tower"]),
        pins: [                       // Location markers
            { name: "CDG", q: "Paris CDG Airport", ll: ll["Paris"] },
            { name: "Eiffel Tower", q: "Eiffel Tower", ll: ll["Eiffel Tower"] }
        ],
        notes: [                      // Bullet points
            "Check in at hotel",
            "Evening walk to Eiffel Tower"
        ],
        highlight: false              // Special styling?
    },
    // Add more days...
];
```

#### Helper Function: `mapDir()`

Creates Google Maps direction URLs:

```javascript
import { mapDir } from "../utils/maps";

// Simple point-to-point
mapDir("Start Location", "End Location")

// Multi-stop route
mapDir("Start", "End", ["Stop 1", "Stop 2", "Stop 3"])
```

### 6. Calendar Day Badges

Add emoji badges to calendar days:

```javascript
export const dayBadges = {
    15: ['✈️'],           // Just flight
    16: ['🏖️', '🍽️'],    // Beach and dinner
    17: ['🚗', '⛰️'],     // Road trip
    // ...
};
```

## 📂 Project Structure

```
trip-planner/
├── public/
│   ├── index.html          # HTML template
│   └── manifest.json       # PWA config
├── src/
│   ├── components/         # Reusable React components
│   │   ├── DayCard.jsx     # Main day display card
│   │   ├── FlightCard.jsx  # Flight information
│   │   ├── CalendarView.jsx # Calendar with emoji badges
│   │   ├── DayMap.jsx      # Leaflet route map
│   │   ├── PhotoCollage.jsx # Photo grid layouts
│   │   └── ...
│   ├── data/
│   │   └── trip.js         # ⭐ YOUR TRIP DATA GOES HERE
│   ├── utils/
│   │   ├── maps.js         # Google Maps & Leaflet utilities
│   │   └── tailwind.js     # Tailwind CDN loader
│   ├── App.jsx             # Main app component
│   └── index.js            # React entry point
└── package.json
```

## 🎨 Tips & Tricks

### Finding Coordinates

1. Go to [LatLong.net](https://www.latlong.net/)
2. Search for your location
3. Copy the coordinates in `[latitude, longitude]` format

### Finding Great Photos

- Use the **Find Photos** button in the Day editor to auto-fill images from Unsplash.
- Or paste your own image URLs manually.

### Customizing Colors

Browse [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors) and update the `palette` object with your favorite color scheme.

### Creating Multiple Trip Planners

Want to track multiple trips? Just duplicate this project folder and customize each one:

```bash
cp -r trip-planner iceland-trip
cd iceland-trip
# Edit src/data/trip.js with Iceland data
npm start
```

## 🌐 Deployment

### GitHub Pages

1. Update `homepage` in `package.json`:
   ```json
   "homepage": "https://yourusername.github.io/your-repo-name"
   ```

2. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add to `package.json` scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d build"
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

### Other Platforms

Build your app and deploy the `build/` folder to:
- **Netlify**: Drag & drop the build folder
- **Vercel**: Connect your GitHub repo
- **Firebase Hosting**: `firebase deploy`

## 🛠️ Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm run build`
Builds the app for production to the `build` folder

### `npm test`
Launches the test runner

## 🤝 Contributing

This is a template project! Feel free to:
- Fork it and make it your own
- Submit PRs with improvements
- Share your customized versions

## 📄 License

MIT License - feel free to use this for your personal or commercial trip planning needs!

## 💡 Example Trips

Check out these example trips using this template:
- [Portugal City Escape](#) - 6-day sample with flights, maps, and notes
- *Add your trip here with a PR!*

---

**Happy travels! ✈️🗺️**

Built with ❤️ using React, Tailwind CSS, and Leaflet
