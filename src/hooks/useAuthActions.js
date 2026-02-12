import { signInWithMagicLink, signInWithGoogle, signOut } from "../lib/cloudTrips";
import { isSupabaseConfigured } from "../lib/supabaseClient";

export default function useAuthActions({
  signInEmail,
  setSignInLoading,
  setShowSignInModal,
  setSignInEmail,
  setUser,
  setMyTrips,
  pushToast,
}) {
  const handleSignIn = async () => {
    setShowSignInModal(true);
  };

  const submitSignIn = async () => {
    if (!isSupabaseConfigured) {
      pushToast("Sign in is unavailable right now. Please try again in a moment.", "error");
      return;
    }
    if (!signInEmail.trim()) {
      pushToast("Enter an email address.", "error");
      return;
    }

    setSignInLoading(true);
    try {
      await signInWithMagicLink(signInEmail.trim());
      setShowSignInModal(false);
      setSignInEmail("");
      pushToast("Check your inbox for your PLNR sign-in link.", "success");
    } catch (error) {
      console.error("Sign in error:", error);
      pushToast(error.message || "Could not send sign-in link.", "error");
    } finally {
      setSignInLoading(false);
    }
  };

  const submitGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      pushToast("Google sign in is unavailable right now.", "error");
      return;
    }
    try {
      signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
      pushToast(error.message || "Could not start Google sign-in.", "error");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
      setMyTrips([]);
    }
  };

  return {
    handleSignIn,
    submitSignIn,
    submitGoogleSignIn,
    handleSignOut,
  };
}
