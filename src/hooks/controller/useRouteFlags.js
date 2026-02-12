export default function useRouteFlags() {
  const isAuthRoute = typeof window !== "undefined" && window.location.pathname === "/auth";
  const isPrivacyRoute = typeof window !== "undefined" && window.location.pathname === "/privacy";
  const isTermsRoute = typeof window !== "undefined" && window.location.pathname === "/terms";

  return {
    isAuthRoute,
    isPrivacyRoute,
    isTermsRoute,
  };
}
