import { router } from "expo-router";
import { useEffect } from "react";

export default function TripSummaryRedirect() {
  useEffect(() => {
    router.replace("/(tabs)/expenses");
  }, []);
  return null;
}
