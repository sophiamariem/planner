import { useMemo } from "react";

export default function usePublishIssues(tripData) {
  return useMemo(() => {
    const issues = [];
    if (!tripData?.tripConfig?.title?.trim()) {
      issues.push({ key: "title", label: "Add a trip title", action: "edit-basic" });
    }
    if (!tripData?.days?.length) {
      issues.push({ key: "days", label: "Add at least one itinerary day", action: "edit-days" });
    }
    if ((tripData?.days || []).some((d) => !d.isoDate)) {
      issues.push({ key: "dates", label: "Set a date for each day", action: "edit-days" });
    }
    if ((tripData?.flights || []).some((f) => !String(f.flightFrom || "").trim() || !String(f.flightTo || "").trim())) {
      issues.push({ key: "flights", label: "Complete each flight from/to", action: "edit-flights" });
    }
    return issues;
  }, [tripData]);
}
