import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = "";
  jest.clearAllMocks();
});

test('renders trip planner title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Trip Planner/i);
  expect(titleElement).toBeInTheDocument();
});

test('can reset from view mode', () => {
  // Mock confirm
  window.confirm = jest.fn(() => true);

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

  // Should be back in onboarding mode
  expect(screen.getByText("Start with Cyprus Template")).toBeInTheDocument();
  expect(localStorage.getItem('current-trip')).toBeNull();
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
