import React from "react";
import TripBuilder from "../components/TripBuilder";

export default function BuilderScreen({
  tripData,
  onSave,
  onCancel,
  onHome,
  onReset,
  initialTab,
  isAdmin,
}) {
  return (
    <TripBuilder
      tripData={tripData}
      onSave={onSave}
      onCancel={onCancel}
      onHome={onHome}
      onReset={onReset}
      initialTab={initialTab}
      isAdmin={isAdmin}
    />
  );
}
