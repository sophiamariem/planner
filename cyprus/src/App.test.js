import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders trip planner title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Trip Planner/i);
  expect(titleElement).toBeInTheDocument();
});

test('can reset from view mode', () => {
  // Mock localStorage
  const localStorageMock = (function() {
    let store = {};
    return {
      getItem: function(key) { return store[key] || null; },
      setItem: function(key, value) { store[key] = value.toString(); },
      removeItem: function(key) { delete store[key]; },
      clear: function() { store = {}; }
    };
  })();
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  
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
