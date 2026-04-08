import { Feather } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { deletePhotoFromLocal, getPhotoUri, savePhotoToLocal } from "@/utils/photoUtils";

export interface ImageFieldHandle {
  show: () => void;
}

interface ImageFieldProps {
  value: string;
  onChange: (path: string) => void;
  label?: string;
}

export const ImageField = forwardRef<ImageFieldHandle, ImageFieldProps>(
  function ImageField({ value, onChange, label = "Receipt Photo" }, ref) {
  const colors = useColors();
  const [showCamera, setShowCamera] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const photoUri = getPhotoUri(value);

  useImperativeHandle(ref, () => ({ show: openActionSheet }));

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow photo library access in Settings to choose photos.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const localPath = await savePhotoToLocal(result.assets[0].uri);
      if (value) await deletePhotoFromLocal(value);
      onChange(localPath);
    }
  }

  function openActionSheet() {
    const hasPhoto = !!value;

    if (Platform.OS === "ios") {
      const options = hasPhoto
        ? ["Take Photo", "Choose from Library", "Remove Photo", "Cancel"]
        : ["Take Photo", "Choose from Library", "Cancel"];
      const destructiveIndex = hasPhoto ? 2 : -1;
      const cancelIndex = hasPhoto ? 3 : 2;

      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: destructiveIndex },
        (index) => {
          if (index === 0) setShowCamera(true);
          else if (index === 1) pickFromGallery();
          else if (hasPhoto && index === 2) {
            deletePhotoFromLocal(value);
            onChange("");
          }
        }
      );
    } else {
      const alertButtons: { text: string; onPress?: () => void; style?: "cancel" | "destructive" }[] = [
        { text: "Take Photo", onPress: () => setShowCamera(true) },
        { text: "Choose from Library", onPress: () => pickFromGallery() },
      ];
      if (hasPhoto) {
        alertButtons.push({
          text: "Remove Photo",
          style: "destructive",
          onPress: () => {
            deletePhotoFromLocal(value);
            onChange("");
          },
        });
      }
      alertButtons.push({ text: "Cancel", style: "cancel" });
      Alert.alert("Receipt Photo", "Choose an option", alertButtons);
    }
  }

  return (
    <View style={styles.wrapper}>
      {value ? (
        <TouchableOpacity
          onPress={() => setExpanded((e) => !e)}
          activeOpacity={0.9}
        >
          <View style={[styles.thumbnailContainer, { borderColor: colors.border }]}>
            <Image
              source={{ uri: photoUri }}
              style={[styles.thumbnail, expanded && styles.thumbnailExpanded]}
              contentFit="cover"
            />
            <TouchableOpacity
              style={[styles.changePillOverlay, { backgroundColor: colors.primary }]}
              onPress={openActionSheet}
              hitSlop={4}
            >
              <Feather name="camera" size={14} color="#fff" />
              <Text style={styles.changePillText}>Change</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={openActionSheet}
          style={[styles.placeholder, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Feather name="camera" size={28} color={colors.primary} />
          <Text style={[styles.placeholderLabel, { color: colors.foreground }]}>
            Add Receipt Photo
          </Text>
          <Text style={[styles.placeholderSub, { color: colors.mutedForeground }]}>
            Tap to take or choose a photo
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCamera(false)}
      >
        <CameraModal
          onConfirm={async (uri) => {
            const localPath = await savePhotoToLocal(uri);
            if (value) await deletePhotoFromLocal(value);
            onChange(localPath);
            setShowCamera(false);
          }}
          onCancel={() => setShowCamera(false)}
        />
      </Modal>
    </View>
  );
});

function CameraModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (uri: string) => Promise<void>;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
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
      await onConfirm(capturedUri);
    } finally {
      setSaving(false);
    }
  }

  if (Platform.OS === "web") {
    return (
      <View style={[camStyles.container, { paddingTop: insets.top }]}>
        <View style={camStyles.permDenied}>
          <Feather name="camera-off" size={48} color="#fff" />
          <Text style={camStyles.permTitle}>Camera not available on web</Text>
          <TouchableOpacity style={camStyles.settingsBtn} onPress={onCancel}>
            <Text style={camStyles.settingsBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={camStyles.container}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={camStyles.container}>
        <View style={camStyles.permDenied}>
          <Feather name="camera-off" size={48} color="#fff" />
          <Text style={camStyles.permTitle}>Camera Access Required</Text>
          <Text style={camStyles.permText}>
            Please allow camera access so you can take receipt photos.
          </Text>
          {permission.canAskAgain ? (
            <TouchableOpacity style={camStyles.settingsBtn} onPress={requestPermission}>
              <Text style={camStyles.settingsBtnText}>Allow Camera</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={camStyles.settingsBtn} onPress={() => Linking.openSettings()}>
              <Text style={camStyles.settingsBtnText}>Open Settings</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[camStyles.settingsBtn, { backgroundColor: "transparent" }]}
            onPress={onCancel}
          >
            <Text style={[camStyles.settingsBtnText, { color: "#aaa" }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (capturedUri) {
    return (
      <View style={camStyles.container}>
        <Image source={{ uri: capturedUri }} style={camStyles.preview} contentFit="contain" />
        <View style={[camStyles.previewBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={camStyles.retakeBtn}
            onPress={() => setCapturedUri(null)}
          >
            <Feather name="refresh-ccw" size={20} color="#fff" />
            <Text style={camStyles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[camStyles.confirmBtn, { opacity: saving ? 0.6 : 1 }]}
            onPress={handleConfirm}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="check" size={20} color="#fff" />
                <Text style={camStyles.confirmBtnText}>Use Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={camStyles.container}>
      <CameraView ref={cameraRef} style={camStyles.camera} facing={facing} />

      <View style={[camStyles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onCancel} style={camStyles.iconBtn} hitSlop={8}>
          <Feather name="x" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={camStyles.topBarTitle}>Take Photo</Text>
        <TouchableOpacity
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          style={camStyles.iconBtn}
          hitSlop={8}
        >
          <Feather name="refresh-ccw" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[camStyles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={handleCapture}
          disabled={capturing}
          style={[camStyles.captureBtn, { opacity: capturing ? 0.6 : 1 }]}
          activeOpacity={0.8}
        >
          <View style={camStyles.captureBtnInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  placeholder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    borderStyle: "solid",
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  placeholderLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  placeholderSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  thumbnailContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative",
  },
  thumbnail: { width: "100%", height: 160 },
  thumbnailExpanded: { height: 320 },
  changePillOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changePillText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

const camStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
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
    backgroundColor: "rgba(0,0,0,0.45)",
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
  permText: {
    color: "#aaa",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  settingsBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#3077FF",
    marginTop: 4,
  },
  settingsBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
