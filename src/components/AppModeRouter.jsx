import React from "react";
import ToastLayer from "./ToastLayer";
import AppOverlays from "./AppOverlays";
import AuthPage from "./AuthPage";
import OnboardingScreen from "../screens/OnboardingScreen";
import BuilderScreen from "../screens/BuilderScreen";
import ViewScreen from "../screens/ViewScreen";
import LoadingScreen from "../screens/LoadingScreen";
import PrivacyPage from "../pages/PrivacyPage";
import TermsPage from "../pages/TermsPage";

export default function AppModeRouter({
  isAuthRoute,
  isPrivacyRoute,
  isTermsRoute,
  mode,
  authProps,
  onboardingProps,
  builderProps,
  viewProps,
  overlayProps,
}) {
  if (isPrivacyRoute) {
    return <PrivacyPage />;
  }

  if (isTermsRoute) {
    return <TermsPage />;
  }

  if (isAuthRoute) {
    return (
      <>
        <AuthPage {...authProps} />
        <ToastLayer toasts={overlayProps.toasts} />
      </>
    );
  }

  if (mode === "onboarding") {
    return (
      <>
        <OnboardingScreen {...onboardingProps} />
        <AppOverlays {...overlayProps} />
      </>
    );
  }

  if (mode === "loading") {
    return <LoadingScreen />;
  }

  if (mode === "builder") {
    return (
      <>
        <BuilderScreen {...builderProps} />
        <AppOverlays {...overlayProps} />
      </>
    );
  }

  return (
    <>
      <ViewScreen {...viewProps} />
      <AppOverlays {...overlayProps} />
    </>
  );
}
