import React from "react";
import TripBuilder from "../components/TripBuilder";
import SignInDrawer from "../components/drawers/SignInDrawer";
import ResetDrawer from "../components/drawers/ResetDrawer";
import ToastLayer from "../components/ToastLayer";

export default function BuilderScreen({
  tripData,
  onSave,
  onCancel,
  onHome,
  onReset,
  initialTab,
  isAdmin,
  showSignInModal,
  onCloseSignInModal,
  isSupabaseConfigured,
  signInEmail,
  onSignInEmailChange,
  onGoogleSignIn,
  onSubmitSignIn,
  signInLoading,
  toasts,
  showResetModal,
  onCloseResetModal,
  onConfirmReset,
}) {
  return (
    <>
      <TripBuilder
        tripData={tripData}
        onSave={onSave}
        onCancel={onCancel}
        onHome={onHome}
        onReset={onReset}
        initialTab={initialTab}
        isAdmin={isAdmin}
      />
      <SignInDrawer
        open={showSignInModal}
        onClose={onCloseSignInModal}
        isSupabaseConfigured={isSupabaseConfigured}
        signInEmail={signInEmail}
        onEmailChange={onSignInEmailChange}
        onGoogleSignIn={onGoogleSignIn}
        onSubmitSignIn={onSubmitSignIn}
        signInLoading={signInLoading}
      />
      <ToastLayer toasts={toasts} />
      <ResetDrawer open={showResetModal} onClose={onCloseResetModal} onConfirm={onConfirmReset} />
    </>
  );
}
