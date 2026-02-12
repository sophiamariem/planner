import React from "react";
import AppModeRouter from "./components/AppModeRouter";
import useTripPlannerController from "./hooks/useTripPlannerController";

export default function TripPlannerApp() {
  const controller = useTripPlannerController();

  return <AppModeRouter {...controller} />;
}
