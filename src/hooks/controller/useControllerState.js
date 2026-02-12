import { useEffect } from "react";
import useTripPlannerUiState from "../useTripPlannerUiState";

export default function useControllerState() {
  const state = useTripPlannerUiState();

  const { mode, setOnboardingPage, user } = state;

  useEffect(() => {
    if (mode !== "onboarding") return;
    setOnboardingPage(user ? "trips" : "create");
  }, [user, mode, setOnboardingPage]);

  return state;
}
