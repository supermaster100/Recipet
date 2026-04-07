import { Feather } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { deletePhotoFromLocal, savePhotoToLocal } from "@/utils/photoUtils";

type ExpenseOptionKey =
  | "general"
  | "atm"
  | "trip"
  | "exchange"
  | "client"
  | "teammate";

interface ExpenseTypeOption {
  key: ExpenseOptionKey;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  colorKey: "primary" | "success" | "warning" | "purple" | "destructive";
}

const EXPENSE_OPTIONS: ExpenseTypeOption[] = [
  { key: "general", icon: "file-text", label: "General Expense", colorKey: "primary" },
  { key: "atm", icon: "credit-card", label: "ATM Withdrawal", colorKey: "success" },
  { key: "trip", icon: "map", label: "Trip / Hotel", colorKey: "warning" },
  { key: "exchange", icon: "refresh-cw", label: "Currency Exchange", colorKey: "purple" },
  { key: "client", icon: "user", label: "Client Transfer", colorKey: "destructive" },
  { key: "teammate", icon: "send", label: "Teammate Transfer", colorKey: "success" },
];

export default function CameraTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isFocused, setIsFocused] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [savedPhotoPath, setSavedPhotoPath] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const cameraRef = useRef<CameraView>(null);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      setSavedPhotoPath(null);
      setShowTypePicker(false);
      setCapturing(false);
      return () => {
        setIsFocused(false);
        setSavedPhotoPath((prev) => {
          if (prev) deletePhotoFromLocal(prev).catch(() => {});
          return null;
        });
        setShowTypePicker(false);
      };
    }, [])
  );

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: true });
      if (!photo?.uri) {
        setCapturing(false);
        return;
      }
      const localPath = await savePhotoToLocal(photo.uri);
      setSavedPhotoPath(localPath);
      setShowTypePicker(true);
    } catch {
      Alert.alert("Error", "Could not capture photo. Please try again.");
    } finally {
      setCapturing(false);
    }
  }

  function handleTypeSelect(option: ExpenseTypeOption) {
    setShowTypePicker(false);
    const photoPath = savedPhotoPath ?? "";
    setSavedPhotoPath(null);

    switch (option.key) {
      case "general":
        router.push({ pathname: "/add-expense", params: { photo: photoPath } });
        break;
      case "atm":
        router.push({ pathname: "/add-atm", params: { photo: photoPath } });
        break;
      case "trip":
        router.push("/(tabs)/trip");
        break;
      case "exchange":
        router.push({ pathname: "/add-exchange", params: { photo: photoPath } });
        break;
      case "client":
        router.push({ pathname: "/add-client-transfer", params: { photo: photoPath } });
        break;
      case "teammate":
        router.push({ pathname: "/add-money-transfer", params: { photo: photoPath } });
        break;
    }
  }

  function handleCancelTypePicker() {
    if (savedPhotoPath) {
      deletePhotoFromLocal(savedPhotoPath).catch(() => {});
    }
    setSavedPhotoPath(null);
    setShowTypePicker(false);
  }

  const colorForKey = (key: ExpenseTypeOption["colorKey"]) => colors[key];

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <View style={[styles.webIcon, { backgroundColor: colors.primary + "18" }]}>
          <Feather name="camera" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.webTitle, { color: colors.foreground }]}>Camera not available</Text>
        <Text style={[styles.webSub, { color: colors.mutedForeground }]}>
          Use a real device to capture expense photos.
        </Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <View style={[styles.permIcon, { backgroundColor: colors.primary + "18" }]}>
          <Feather name="camera-off" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.permTitle, { color: colors.foreground }]}>Camera Access Required</Text>
        <Text style={[styles.permSub, { color: colors.mutedForeground }]}>
          Allow camera access to capture expense photos.
        </Text>
        <TouchableOpacity
          onPress={async () => {
            const result = await requestPermission();
            if (!result.granted && !result.canAskAgain) {
              Linking.openSettings();
            }
          }}
          style={[styles.permBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.permBtnText, { color: colors.primaryForeground }]}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      {isFocused && !showTypePicker && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
        />
      )}

      {!showTypePicker && (
        <>
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
              style={styles.flipBtn}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              onPress={handleCapture}
              disabled={capturing}
              style={({ pressed }) => [
                styles.captureOuter,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={[styles.captureInner, { opacity: capturing ? 0.5 : 1 }]}>
                {capturing && <ActivityIndicator color="#000" size="small" />}
              </View>
            </Pressable>
          </View>
        </>
      )}

      {showTypePicker && (
        <View style={[StyleSheet.absoluteFill, styles.pickerOverlay]}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.pickerHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
              What type of expense?
            </Text>
            <Text style={[styles.pickerSub, { color: colors.mutedForeground }]}>
              Choose a category for this photo
            </Text>

            <View style={styles.optionsGrid}>
              {EXPENSE_OPTIONS.map((option) => {
                const tint = colorForKey(option.colorKey);
                return (
                  <TouchableOpacity
                    key={option.label}
                    onPress={() => handleTypeSelect(option)}
                    style={[styles.optionCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: tint + "18" }]}>
                      <Feather name={option.icon} size={22} color={tint} />
                    </View>
                    <Text style={[styles.optionLabel, { color: colors.foreground }]} numberOfLines={2}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleCancelTypePicker}
              style={[styles.cancelBtn, { backgroundColor: colors.secondary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel — Discard Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  webIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  webTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  webSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  permIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  permTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  permSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  permBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  permBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerOverlay: {
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    zIndex: 20,
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginTop: 4,
  },
  pickerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 4,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionCard: {
    width: "30.5%",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
  },
  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
