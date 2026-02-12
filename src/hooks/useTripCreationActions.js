import { tripConfig as defaultTripConfig, flights as defaultFlights, days as defaultDays, dayBadges as defaultDayBadges, palette, ll as defaultLocations } from "../data/trip";
import { buildTemplateTrip, getTemplateJson } from "../utils/tripTemplates";
import { saveTripToLocalStorage, updateURLWithTrip, validateTripData } from "../utils/tripData";

export default function useTripCreationActions({
  isAdminUser,
  pushToast,
  importJson,
  setTripData,
  setBuilderStartTab,
  setCloudTripId,
  setCloudSlug,
  setShareToken,
  setCloudShareAccess,
  setCloudOwnerId,
  setCloudCollaboratorRole,
  setSourceUrl,
  setMode,
  setShowImportModal,
  setImportJson,
  setImportError,
}) {
  const templateJSON = getTemplateJson(palette);

  const openImportModal = () => {
    if (!isAdminUser) {
      pushToast("This import tool is only available to admins.", "error");
      return;
    }
    setImportJson(templateJSON);
    setShowImportModal(true);
    setImportError("");
  };

  const openBuilderWithTrip = (nextTripData) => {
    setTripData(nextTripData);
    setBuilderStartTab("basic");
    setCloudTripId(null);
    setCloudSlug(null);
    setShareToken(null);
    setCloudShareAccess("view");
    setCloudOwnerId(null);
    setCloudCollaboratorRole(null);
    setSourceUrl(null);
    setMode("builder");
  };

  const handleStartFromTemplate = () => {
    const templateData = {
      tripConfig: defaultTripConfig,
      flights: defaultFlights,
      days: defaultDays,
      dayBadges: defaultDayBadges,
      ll: defaultLocations,
      palette,
    };
    openBuilderWithTrip(templateData);
  };

  const handleStartFromQuickTemplate = (templateId) => {
    const templateData = buildTemplateTrip(templateId, palette);
    if (!templateData) return;
    openBuilderWithTrip(templateData);
  };

  const handleStartFromScratch = () => {
    const emptyData = {
      tripConfig: {
        title: "My Trip",
        footer: "My Adventure",
        favicon: null,
        cover: null,
        calendar: { year: new Date().getFullYear(), month: new Date().getMonth() },
        badgeLegend: [],
      },
      flights: [],
      days: [],
      dayBadges: {},
      ll: {},
      palette,
    };
    openBuilderWithTrip(emptyData);
  };

  const handleImportJson = () => {
    if (!isAdminUser) {
      pushToast("This import tool is only available to admins.", "error");
      return;
    }
    try {
      if (!importJson.trim()) {
        setImportError("Please paste some JSON data first.");
        return;
      }
      const parsed = JSON.parse(importJson);
      const validation = validateTripData(parsed);

      if (validation.valid) {
        const importedLl = parsed.ll || {};
        const extractedLl = { ...importedLl };

        if (parsed.days && Array.isArray(parsed.days)) {
          parsed.days.forEach((day) => {
            if (day.pins && Array.isArray(day.pins)) {
              day.pins.forEach((pin) => {
                if (pin.name && pin.ll && !extractedLl[pin.name]) {
                  extractedLl[pin.name] = pin.ll;
                }
              });
            }
          });
        }

        const importedBadges = parsed.dayBadges || {};
        const extractedBadges = { ...importedBadges };

        if (Object.keys(extractedBadges).length === 0 && parsed.days && Array.isArray(parsed.days)) {
          parsed.days.forEach((day) => {
            const dayId = Number(day.id);
            if (isNaN(dayId)) return;

            const emojis = [];
            (day.notes || []).forEach((note) => {
              const found = note.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
              if (found) emojis.push(...found);
            });

            if (emojis.length > 0) {
              extractedBadges[dayId] = [...new Set(emojis)];
            }
          });
        }

        const sanitizedData = {
          ...parsed,
          flights: parsed.flights || [],
          days: (parsed.days || []).map((day) => ({
            ...day,
            pins: day.pins || [],
            notes: day.notes || [],
          })),
          ll: extractedLl,
          dayBadges: extractedBadges,
          palette: parsed.palette || palette,
        };

        setTripData(sanitizedData);
        setCloudTripId(null);
        setCloudSlug(null);
        setShareToken(null);
        setCloudShareAccess("view");
        setCloudOwnerId(null);
        setCloudCollaboratorRole(null);
        setSourceUrl(null);
        setMode("view");
        setShowImportModal(false);
        setImportJson("");
        setImportError("");
        saveTripToLocalStorage(sanitizedData);
        updateURLWithTrip(sanitizedData);
      } else {
        setImportError(`Invalid trip data: ${validation.error}`);
      }
    } catch (_error) {
      setImportError("Invalid JSON format. Please check your syntax.");
    }
  };

  return {
    templateJSON,
    openImportModal,
    handleStartFromTemplate,
    handleStartFromQuickTemplate,
    handleStartFromScratch,
    handleImportJson,
  };
}
