import useAuthActions from "../useAuthActions";

export default function useTripAuthDomain({
  signInEmail,
  setSignInLoading,
  setShowSignInModal,
  setSignInEmail,
  setUser,
  setMyTrips,
  pushToast,
}) {
  return useAuthActions({
    signInEmail,
    setSignInLoading,
    setShowSignInModal,
    setSignInEmail,
    setUser,
    setMyTrips,
    pushToast,
  });
}
