import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = "";
  jest.clearAllMocks();
});

test('renders brand title', () => {
  render(<App />);
  const titleElement = screen.getByText(/plnr\.guide/i);
  expect(titleElement).toBeInTheDocument();
});

test('can reset from view mode', () => {
  // Set some initial data in localStorage to trigger view mode
  localStorage.setItem('current-trip', JSON.stringify({
    tripConfig: { title: "Test Trip", calendar: { year: 2025, month: 5 } },
    days: [],
    flights: []
  }));

  render(<App />);

  // Should be in view mode
  expect(screen.getByText("Test Trip")).toBeInTheDocument();

  // Find and click reset button
  const resetButton = screen.getByText("Reset");
  fireEvent.click(resetButton);

  // Confirm reset in modal
  const confirmResetButton = screen.getByText("Reset Trip");
  fireEvent.click(confirmResetButton);

  // Should be back in onboarding mode
  expect(screen.getByText("Start with Example Template")).toBeInTheDocument();
  expect(localStorage.getItem('current-trip')).toBeNull();
});

test('can generate a view-only share link', () => {
  const tripData = {
    tripConfig: { title: "Test Trip", calendar: { year: 2025, month: 5 } },
    days: [],
    flights: []
  };
  localStorage.setItem('current-trip', JSON.stringify(tripData));
  
  render(<App />);
  
  // Open share modal
  const shareButton = screen.getByText("Share");
  fireEvent.click(shareButton);
  
  // Find view only checkbox
  const checkbox = screen.getByLabelText("View Only Mode");
  fireEvent.click(checkbox);
  
  // The input value should now contain view=1
  const inputs = screen.getAllByRole("textbox");
  const shareInput = inputs.find(i => i.value.includes("#trip=") || i.value.includes("#source="));
  expect(shareInput.value).toContain("view=1");
});

test('can load trip from source link', async () => {
  const tripData = {
    tripConfig: { title: "Custom Trip", calendar: { year: 2026, month: 3 } },
    days: [],
    flights: []
  };

  // Mock successful fetch
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(tripData),
    })
  );

  // Set hash before rendering
  window.location.hash = "#puglia";

  render(<App />);

  // Should show loading then view mode
  await waitFor(() => {
    expect(screen.getByText("Custom Trip")).toBeInTheDocument();
  });

  expect(global.fetch).toHaveBeenCalledWith('itineraries/puglia.json');

  // Edit button should NOT be there because it's a source trip
  expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  // Reset button should NOT be there
  expect(screen.queryByText("Reset")).not.toBeInTheDocument();
});

test('hides edit button in view-only mode', () => {
  // Directly set a trip in localStorage and set hash to view=1
  const tripData = {
    tripConfig: { title: "Vietnam Trip", calendar: { year: 2026, month: 3 } },
    days: [],
    flights: []
  };
  localStorage.setItem('current-trip', JSON.stringify(tripData));
  window.location.hash = "#view=1";
  
  render(<App />);
  
  // Title should be there (Vietnam Trip)
  expect(screen.getByText(/Vietnam Trip/i)).toBeInTheDocument();
  
  // Edit button should NOT be there
  expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  // Reset button should NOT be there
  expect(screen.queryByText("Reset")).not.toBeInTheDocument();
});

test('can load trip from external source', async () => {
  const mockTrip = {
    tripConfig: { title: "External Trip", calendar: { year: 2025, month: 5 } },
    days: [],
    flights: []
  };
  
  // Mock fetch
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockTrip),
    })
  );

  window.location.hash = "#source=https://example.com/trip.json";
  
  render(<App />);
  
  // Should show loading initially
  expect(screen.getByText(/Loading your trip/i)).toBeInTheDocument();
  
  // Wait for external trip to load
  const title = await screen.findByText("External Trip");
  expect(title).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith("https://example.com/trip.json");
});

test('can import trip via JSON from onboarding', () => {
  render(<App />);
  
  // Click "Import JSON" button
  const importButton = screen.getByText(/Import JSON/i);
  fireEvent.click(importButton);
  
  // Should see the modal
  expect(screen.getByText("Import Trip JSON")).toBeInTheDocument();
  
  const validTrip = {
    tripConfig: { title: "Imported Trip", calendar: { year: 2025, month: 5 } },
    days: [],
    flights: []
  };
  
  const textarea = screen.getByPlaceholderText(/\{ "tripConfig":/);
  fireEvent.change(textarea, { target: { value: JSON.stringify(validTrip) } });
  
  const submitButton = screen.getByText("Import Data");
  fireEvent.click(submitButton);
  
  // Should be in view mode with imported title
  expect(screen.getByText("Imported Trip")).toBeInTheDocument();
});

test('shows specific error message when JSON is missing required fields', () => {
  render(<App />);
  
  // Wait for onboarding to be visible
  const importButton = screen.getByText(/Import JSON/i);
  fireEvent.click(importButton);
  
  // Provide JSON missing 'days' (required)
  const invalidTrip = {
    tripConfig: { title: "Invalid Trip", calendar: { year: 2026, month: 3 } }
  };
  
  const textarea = screen.getByPlaceholderText(/\{ "tripConfig":/);
  fireEvent.change(textarea, { target: { value: JSON.stringify(invalidTrip) } });
  
  const submitButton = screen.getByText("Import Data");
  fireEvent.click(submitButton);
  
  // Should show specific error message.
  expect(screen.getByText(/Invalid trip data: Missing or invalid 'days' array/i)).toBeInTheDocument();
});

test('successfully imports JSON even if flights are missing', () => {
  render(<App />);
  
  const importButton = screen.getByText(/Import JSON/i);
  fireEvent.click(importButton);
  
  const tripWithoutFlights = {
    tripConfig: { title: "No Flights Trip", calendar: { year: 2026, month: 3 } },
    days: [{ id: "1", title: "Day 1", dow: "Wed", date: "1 Apr", notes: [] }]
  };
  
  const textarea = screen.getByPlaceholderText(/\{ "tripConfig":/);
  fireEvent.change(textarea, { target: { value: JSON.stringify(tripWithoutFlights) } });
  
  const submitButton = screen.getByText("Import Data");
  fireEvent.click(submitButton);
  
  // Should successfully import and show view mode
  expect(screen.getByText("No Flights Trip")).toBeInTheDocument();
});

test('automatically extracts locations from pins if ll is empty during JSON import', () => {
  render(<App />);
  
  const importButton = screen.getByText(/Import JSON/i);
  fireEvent.click(importButton);
  
  const tripWithPinsButNoLL = {
    tripConfig: { title: "Pins Trip", calendar: { year: 2026, month: 3 } },
    days: [
      { 
        id: "1", 
        title: "Day 1", 
        dow: "Wed", 
        date: "1 Apr", 
        notes: [],
        pins: [{ name: "Test Location", q: "Test Q", ll: [10, 20] }]
      }
    ],
    ll: {} // Empty ll
  };
  
  const textarea = screen.getByPlaceholderText(/\{ "tripConfig":/);
  fireEvent.change(textarea, { target: { value: JSON.stringify(tripWithPinsButNoLL) } });
  
  const submitButton = screen.getByText("Import Data");
  fireEvent.click(submitButton);
  
  // Click Edit to go to TripBuilder
  const editButton = screen.getByText("Edit");
  fireEvent.click(editButton);
  
  // Go to Locations tab
  const locationsTab = screen.getByText("Locations");
  fireEvent.click(locationsTab);
  
  // Should see the location that was extracted from pins
  expect(screen.getByText("Test Location")).toBeInTheDocument();
  expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  expect(screen.getByDisplayValue("20")).toBeInTheDocument();
});

test('automatically extracts badges from notes if dayBadges is empty during JSON import', () => {
  render(<App />);
  
  const importButton = screen.getByText(/Import JSON/i);
  fireEvent.click(importButton);
  
  const tripWithNotesButNoBadges = {
    tripConfig: { title: "Badges Trip", calendar: { year: 2026, month: 3 } },
    days: [
      { 
        id: "1", 
        title: "Day 1", 
        dow: "Wed", 
        date: "1 Apr", 
        notes: ["Flight ✈️ to Hanoi", "Coffee ☕ time"]
      }
    ],
    dayBadges: {} // Empty dayBadges
  };
  
  const textarea = screen.getByPlaceholderText(/\{ "tripConfig":/);
  fireEvent.change(textarea, { target: { value: JSON.stringify(tripWithNotesButNoBadges) } });
  
  const submitButton = screen.getByText("Import Data");
  fireEvent.click(submitButton);
  
  // Switch to Calendar view
  const calendarTab = screen.getByText("Calendar");
  fireEvent.click(calendarTab);
  
  // Should see the emojis in the calendar day cell
  // CalendarView renders badges in a div with text content
  // Note: Emoji rendering in JSDOM/Testing Library can be tricky with variation selectors
  expect(screen.getByText(/✈/)).toBeInTheDocument();
  expect(screen.getByText(/☕/)).toBeInTheDocument();
});
