export function extractStartIsoFromTrip(tripLike) {
  const days = tripLike?.days || tripLike?.trip_data?.days || [];
  const isoDates = (days || []).map((d) => d.isoDate).filter(Boolean).sort();
  if (isoDates.length) return isoDates[0];
  return null;
}

export function extractEndIsoFromTrip(tripLike) {
  const days = tripLike?.days || tripLike?.trip_data?.days || [];
  const isoDates = (days || []).map((d) => d.isoDate).filter(Boolean).sort();
  if (isoDates.length) return isoDates[isoDates.length - 1];
  return null;
}

export function extractCoverImage(tripLike) {
  return (
    tripLike?.tripConfig?.cover ||
    tripLike?.trip_data?.tripConfig?.cover ||
    tripLike?.days?.find((d) => (d.photos || []).length > 0)?.photos?.[0] ||
    tripLike?.trip_data?.days?.find((d) => (d.photos || []).length > 0)?.photos?.[0] ||
    null
  );
}

export function attachCopyAttribution(tripData, source = {}) {
  const base = tripData || {};
  const existing = base?.tripConfig?.copiedFrom || {};
  return {
    ...base,
    tripConfig: {
      ...(base.tripConfig || {}),
      copiedFrom: {
        ownerId: source.ownerId || existing.ownerId || null,
        tripId: source.tripId || existing.tripId || null,
        slug: source.slug || existing.slug || null,
        savedAt: new Date().toISOString(),
      },
    },
  };
}

export function formatVisibilityLabel(visibility) {
  const value = String(visibility || "").toLowerCase();
  if (value === "private") return "Not shared yet";
  if (value === "unlisted") return "Shared (link only)";
  if (value === "public") return "Public";
  return "Not shared yet";
}
