import { Feather } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { savePhotoToLocal } from "@/utils/photoUtils";

export default function CameraScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ returnKey?: string }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) setCapturedUri(photo.uri);
    } finally {
      setCapturing(false);
    }
  }

  async function handleConfirm() {
    if (!capturedUri) return;
    setSaving(true);
    try {
      const localPath = await savePhotoToLocal(capturedUri);
      router.back();
      if (params.returnKey) {
        router.setParams({ [params.returnKey]: localPath });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleRetake() {
    setCapturedUri(null);
  }

  function handleCancel() {
    router.back();
  }

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <View style={styles.permDenied}>
          <Feather name="camera-off" size={48} color="#fff" />
          <Text style={styles.permText}>Camera is not available on web.</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={handleCancel}>
            <Text style={styles.settingsBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <View style={styles.permDenied}>
          <Feather name="camera-off" size={48} color="#fff" />
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permText}>
            Please allow camera access so you can take receipt photos.
          </Text>
          {permission.canAskAgain ? (
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={requestPermission}
            >
              <Text style={styles.settingsBtnText}>Allow Camera</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.settingsBtnText}>Open Settings</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.settingsBtn, styles.cancelBtn]}
            onPress={handleCancel}
          >
            <Text style={[styles.settingsBtnText, { color: "#aaa" }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (capturedUri) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <Image
          source={{ uri: capturedUri }}
          style={styles.preview}
          contentFit="contain"
        />
        <View style={[styles.previewBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
            <Feather name="refresh-ccw" size={20} color="#fff" />
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, { opacity: saving ? 0.6 : 1 }]}
            onPress={handleConfirm}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="check" size={20} color="#fff" />
                <Text style={styles.confirmBtnText}>Use Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.iconBtn} hitSlop={8}>
          <Feather name="x" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Camera</Text>
        <TouchableOpacity
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <Feather name="refresh-ccw" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={handleCapture}
          disabled={capturing}
          style={[styles.captureBtn, { opacity: capturing ? 0.6 : 1 }]}
          activeOpacity={0.8}
        >
          <View style={styles.captureBtnInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  topBarTitle: { color: "#fff", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingTop: 20,
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
  preview: { flex: 1 },
  previewBar: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingTop: 20,
    backgroundColor: "#000",
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  retakeBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_500Medium" },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#3077FF",
  },
  confirmBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  permDenied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  permTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  permText: { color: "#aaa", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  settingsBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#3077FF",
    marginTop: 4,
  },
  settingsBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { backgroundColor: "transparent" },
});
