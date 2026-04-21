import { formatDistanceToNow } from "date-fns";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useSyncContext } from "@/context/SyncContext";

export function SyncStatusBar() {
  const colors = useColors();
  const { syncStatus, lastSyncedAt, isOnline } = useSyncContext();

  let label: string;
  let dotColor: string;
  let showSpinner = false;

  if (!isOnline || syncStatus === "offline") {
    label = "Offline — changes saved locally";
    dotColor = colors.mutedForeground;
  } else if (syncStatus === "syncing") {
    label = "Syncing…";
    dotColor = colors.primary;
    showSpinner = true;
  } else if (syncStatus === "error") {
    label = "Sync failed — will retry";
    dotColor = "#ef4444";
  } else {
    label = lastSyncedAt
      ? `Synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`
      : "Not yet synced";
    dotColor = "#22c55e";
  }

  return (
    <View style={[styles.bar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {showSpinner ? (
        <ActivityIndicator size="small" color={dotColor} style={styles.dot} />
      ) : (
        <View style={[styles.dot, styles.dotCircle, { backgroundColor: dotColor }]} />
      )}
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dotCircle: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
