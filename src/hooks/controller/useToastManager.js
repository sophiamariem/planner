export default function useToastManager(setToasts) {
  const toSafeUserMessage = (message, fallback) => {
    const raw = String(message || "").trim();
    if (!raw) return fallback;
    const lower = raw.toLowerCase();
    if (
      lower.includes("supabase") ||
      lower.includes("react_app_") ||
      lower.includes("expo_public_") ||
      lower.includes("jwt") ||
      lower.includes("token") ||
      lower.includes("postgres") ||
      lower.includes("sql") ||
      lower.includes("schema") ||
      lower.includes("relation") ||
      lower.includes("policy") ||
      lower.includes("auth/v1") ||
      lower.includes("rest/v1") ||
      lower.includes("unsupported provider") ||
      lower.includes("provider is not enabled")
    ) {
      return fallback;
    }
    return raw;
  };

  const pushToast = (message, tone = "info") => {
    const safeMessage = toSafeUserMessage(
      message,
      tone === "error" ? "Something went wrong. Please try again." : "Done."
    );
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message: safeMessage, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  return {
    pushToast,
  };
}
