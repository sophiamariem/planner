import { extractLocationsFromPins, extractBadgesFromNotes, normalizeImportedTripData } from "./importTripData";

describe("importTripData utils", () => {
  test("extractLocationsFromPins merges missing ll entries from pins", () => {
    const days = [
      { pins: [{ name: "A", ll: [1, 2] }, { name: "B", ll: [3, 4] }] },
      { pins: [{ name: "A", ll: [9, 9] }, { name: "C", ll: [5, 6] }] },
    ];
    const result = extractLocationsFromPins(days, { A: [7, 8] });
    expect(result).toEqual({
      A: [7, 8],
      B: [3, 4],
      C: [5, 6],
    });
  });

  test("extractBadgesFromNotes keeps existing badges when provided", () => {
    const days = [{ id: "1", notes: ["Beach 🏖️"] }];
    const result = extractBadgesFromNotes(days, { 1: ["✅"] });
    expect(result).toEqual({ 1: ["✅"] });
  });

  test("extractBadgesFromNotes extracts unique emojis per day when empty", () => {
    const days = [
      { id: "1", notes: ["Cafe ☕ and beach 🏖️", "Another ☕ stop"] },
      { id: "2", notes: ["No emoji note"] },
    ];
    const result = extractBadgesFromNotes(days, {});
    expect(result[1]).toEqual(expect.arrayContaining(["☕", "🏖"]));
    expect(result[1].length).toBeGreaterThanOrEqual(2);
    expect(result[2]).toBeUndefined();
  });

  test("normalizeImportedTripData fills optional fields and applies fallback palette", () => {
    const parsed = {
      days: [{ id: "1", title: "Day", pins: [{ name: "Town", ll: [10, 20] }] }],
    };
    const normalized = normalizeImportedTripData(parsed, { card: "x" });

    expect(normalized.flights).toEqual([]);
    expect(normalized.days[0].notes).toEqual([]);
    expect(normalized.ll).toEqual({ Town: [10, 20] });
    expect(normalized.palette).toEqual({ card: "x" });
  });
});
