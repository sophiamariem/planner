export function extractLocationsFromPins(days = [], baseLocations = {}) {
  const merged = { ...(baseLocations || {}) };
  (days || []).forEach((day) => {
    (day?.pins || []).forEach((pin) => {
      if (pin?.name && pin?.ll && !merged[pin.name]) {
        merged[pin.name] = pin.ll;
      }
    });
  });
  return merged;
}

export function extractBadgesFromNotes(days = [], existingBadges = {}) {
  const badges = { ...(existingBadges || {}) };
  if (Object.keys(badges).length > 0) return badges;

  (days || []).forEach((day) => {
    const dayId = Number(day?.id);
    if (Number.isNaN(dayId)) return;

    const emojis = [];
    (day?.notes || []).forEach((note) => {
      const found = String(note || "").match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
      if (found) emojis.push(...found);
    });

    if (emojis.length > 0) {
      badges[dayId] = [...new Set(emojis)];
    }
  });

  return badges;
}

export function normalizeImportedTripData(parsed, fallbackPalette) {
  const days = (parsed?.days || []).map((day) => ({
    ...day,
    pins: day?.pins || [],
    notes: day?.notes || [],
  }));

  const ll = extractLocationsFromPins(days, parsed?.ll || {});
  const dayBadges = extractBadgesFromNotes(days, parsed?.dayBadges || {});

  return {
    ...parsed,
    flights: parsed?.flights || [],
    days,
    ll,
    dayBadges,
    palette: parsed?.palette || fallbackPalette,
  };
}
