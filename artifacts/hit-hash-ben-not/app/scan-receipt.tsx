import { Feather } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { CURRENCIES, type Currency } from "@/db/types";
import { analyzeReceiptImage, type OcrResult } from "@/utils/receiptOcr";
import { savePhotoToLocal } from "@/utils/photoUtils";

type FlowStep =
  | "idle"
  | "camera"
  | "analyzing"
  | "confirm-detection"
  | "manual-picker"
  | "ready";

interface AutoFilledData {
  photo: string;
  currency: Currency | null;
  amount: string | null;
  date: string | null;
  ocrResult: OcrResult;
}

export default function ScanReceiptScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [step, setStep] = useState<FlowStep>("idle");
  const [autoFilled, setAutoFilled] = useState<AutoFilledData | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("ILS");
  const [showCurrencySearch, setShowCurrencySearch] = useState(false);

  async function handleLaunchCamera() {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "Camera scanning is only available on iOS and Android. Please use the Add Expense form to enter details manually."
      );
      return;
    }
    setStep("camera");
  }

  async function handlePickFromGallery() {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "Receipt scanning is only available on iOS and Android."
      );
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow photo library access in Settings.",
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
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await processImage(result.assets[0].uri);
    }
  }

  async function processImage(uri: string) {
    setStep("analyzing");
    try {
      const localPath = await savePhotoToLocal(uri);
      const ocrResult = await analyzeReceiptImage(localPath);

      const data: AutoFilledData = {
        photo: localPath,
        currency: ocrResult.detectedCurrency,
        amount: ocrResult.detectedAmount ? String(ocrResult.detectedAmount) : null,
        date: ocrResult.detectedDate,
        ocrResult,
      };

      setAutoFilled(data);
      setSelectedCurrency(ocrResult.detectedCurrency ?? "ILS");

      if (ocrResult.detectedCurrency) {
        setStep("confirm-detection");
      } else {
        setStep("manual-picker");
      }
    } catch {
      Alert.alert(
        "Scan Failed",
        "Could not read text from the receipt. Please enter details manually.",
        [
          { text: "Enter Manually", onPress: () => router.push("/add-expense") },
          { text: "Try Again", onPress: () => setStep("idle") },
        ]
      );
      setStep("idle");
    }
  }

  function handleApproveDetection() {
    if (!autoFilled) return;
    setAutoFilled((prev) =>
      prev ? { ...prev, currency: selectedCurrency } : prev
    );
    setStep("ready");
  }

  function handleChangeDetection() {
    setStep("manual-picker");
  }

  function handleManualSelect(currency: Currency) {
    setSelectedCurrency(currency);
    setShowCurrencySearch(false);
    setAutoFilled((prev) =>
      prev ? { ...prev, currency } : prev
    );
    setStep("ready");
  }

  function handleProceedToExpense() {
    if (!autoFilled) return;
    const currency = autoFilled.currency ?? selectedCurrency;
    const params: Record<string, string> = {
      photo: autoFilled.photo,
      currency,
      autoFilled: "true",
    };
    if (autoFilled.amount) params["amount"] = autoFilled.amount;
    if (autoFilled.date) params["date"] = autoFilled.date;
    router.push({ pathname: "/add-expense", params });
  }

  if (step === "camera") {
    return (
      <CameraCapture
        onCapture={async (uri) => {
          setStep("idle");
          await processImage(uri);
        }}
        onCancel={() => setStep("idle")}
      />
    );
  }

  if (step === "analyzing") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { paddingTop: topInset + 8, borderBottomColor: colors.border },
          ]}
        >
          <View style={{ width: 22 }} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Analyzing Receipt
          </Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.analyzingText, { color: colors.foreground }]}>
            Reading receipt text…
          </Text>
          <Text style={[styles.analyzingSubText, { color: colors.mutedForeground }]}>
            Detecting currency, amount, and date
          </Text>
        </View>
      </View>
    );
  }

  if (step === "confirm-detection" && autoFilled) {
    return (
      <DetectionConfirmScreen
        topInset={topInset}
        colors={colors}
        autoFilled={autoFilled}
        selectedCurrency={selectedCurrency}
        onApprove={handleApproveDetection}
        onChange={handleChangeDetection}
        onBack={() => setStep("idle")}
      />
    );
  }

  if (step === "manual-picker") {
    return (
      <ManualCurrencyPicker
        topInset={topInset}
        colors={colors}
        insets={insets}
        selectedCurrency={selectedCurrency}
        onSelect={handleManualSelect}
        onBack={() => setStep(autoFilled ? "confirm-detection" : "idle")}
      />
    );
  }

  if (step === "ready" && autoFilled) {
    return (
      <ReadySummaryScreen
        topInset={topInset}
        colors={colors}
        autoFilled={autoFilled}
        selectedCurrency={selectedCurrency}
        onProceed={handleProceedToExpense}
        onRescan={() => setStep("idle")}
        onChangeCurrency={() => setStep("manual-picker")}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Scan Receipt
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={[styles.introText, { color: colors.mutedForeground }]}>
          Scan or upload a receipt photo to automatically detect the currency,
          amount, and date.
        </Text>

        <TouchableOpacity
          onPress={handleLaunchCamera}
          style={[
            styles.optionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.optionIconWrap,
              { backgroundColor: colors.primary + "18" },
            ]}
          >
            <Feather name="camera" size={28} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.foreground }]}>
              Take a Photo
            </Text>
            <Text
              style={[styles.optionDesc, { color: colors.mutedForeground }]}
            >
              Use your camera to capture the receipt
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={20}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePickFromGallery}
          style={[
            styles.optionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.optionIconWrap,
              { backgroundColor: colors.primary + "18" },
            ]}
          >
            <Feather name="image" size={28} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.foreground }]}>
              Choose from Gallery
            </Text>
            <Text
              style={[styles.optionDesc, { color: colors.mutedForeground }]}
            >
              Pick an existing receipt photo
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={20}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/add-expense")}
          style={[
            styles.optionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.optionIconWrap,
              { backgroundColor: colors.mutedForeground + "22" },
            ]}
          >
            <Feather name="edit-3" size={28} color={colors.mutedForeground} />
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.foreground }]}>
              Enter Manually
            </Text>
            <Text
              style={[styles.optionDesc, { color: colors.mutedForeground }]}
            >
              Fill in expense details yourself
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={20}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>

        <View
          style={[styles.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}
        >
          <Feather name="shield" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            All processing happens on your device. No data is sent to any server.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function DetectionConfirmScreen({
  topInset,
  colors,
  autoFilled,
  selectedCurrency,
  onApprove,
  onChange,
  onBack,
}: {
  topInset: number;
  colors: ReturnType<typeof useColors>;
  autoFilled: AutoFilledData;
  selectedCurrency: Currency;
  onApprove: () => void;
  onChange: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const confidenceColor =
    autoFilled.ocrResult.confidence === "high"
      ? colors.success
      : autoFilled.ocrResult.confidence === "medium"
      ? "#F59E0B"
      : colors.destructive;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Detected Info
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}
      >
        {autoFilled.photo ? (
          <Image
            source={{ uri: autoFilled.photo.startsWith("file://") ? autoFilled.photo : `file://${autoFilled.photo}` }}
            style={[styles.receiptPreview, { borderColor: colors.border }]}
            contentFit="contain"
          />
        ) : null}

        <View
          style={[
            styles.detectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.detectionHeader}>
            <Text style={[styles.detectionTitle, { color: colors.foreground }]}>
              Auto-Detected
            </Text>
            <View
              style={[
                styles.confidenceBadge,
                { backgroundColor: confidenceColor + "22" },
              ]}
            >
              <View
                style={[
                  styles.confidenceDot,
                  { backgroundColor: confidenceColor },
                ]}
              />
              <Text
                style={[styles.confidenceLabel, { color: confidenceColor }]}
              >
                {autoFilled.ocrResult.confidence === "high"
                  ? "High confidence"
                  : autoFilled.ocrResult.confidence === "medium"
                  ? "Medium confidence"
                  : "Low confidence"}
              </Text>
            </View>
          </View>

          <DetectionRow
            label="Currency"
            value={selectedCurrency}
            icon="dollar-sign"
            colors={colors}
          />
          {autoFilled.amount && (
            <DetectionRow
              label="Amount"
              value={autoFilled.amount}
              icon="hash"
              colors={colors}
            />
          )}
          {autoFilled.date && (
            <DetectionRow
              label="Date"
              value={autoFilled.date}
              icon="calendar"
              colors={colors}
            />
          )}
          {autoFilled.ocrResult.detectedLanguage && (
            <DetectionRow
              label="Language"
              value={autoFilled.ocrResult.detectedLanguage.toUpperCase()}
              icon="globe"
              colors={colors}
            />
          )}
        </View>

        <Text style={[styles.confirmPrompt, { color: colors.mutedForeground }]}>
          Is this correct? You can approve these values or change them before
          filling in your expense.
        </Text>

        <TouchableOpacity
          onPress={onApprove}
          style={[styles.approveBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.approveBtnText}>Approve & Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onChange}
          style={[
            styles.changeBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="edit-2" size={16} color={colors.foreground} />
          <Text style={[styles.changeBtnText, { color: colors.foreground }]}>
            Change Currency
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetectionRow({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.detectionRow, { borderTopColor: colors.border }]}>
      <View style={styles.detectionRowLeft}>
        <Feather name={icon} size={15} color={colors.mutedForeground} />
        <Text style={[styles.detectionRowLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.detectionRowValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function ManualCurrencyPicker({
  topInset,
  colors,
  insets,
  selectedCurrency,
  onSelect,
  onBack,
}: {
  topInset: number;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
  selectedCurrency: Currency;
  onSelect: (c: Currency) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = CURRENCIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Select Currency
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search currency…"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
          autoCapitalize="characters"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        {filtered.map((c) => {
          const active = c === selectedCurrency;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => onSelect(c)}
              style={[
                styles.currencyOption,
                {
                  backgroundColor: active
                    ? colors.primary + "18"
                    : "transparent",
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.currencyOptionText,
                  { color: active ? colors.primary : colors.foreground },
                ]}
              >
                {c}
              </Text>
              {active && (
                <Feather name="check" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && (
          <Text
            style={[
              styles.noResults,
              { color: colors.mutedForeground },
            ]}
          >
            No currencies match "{search}"
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function ReadySummaryScreen({
  topInset,
  colors,
  autoFilled,
  selectedCurrency,
  onProceed,
  onRescan,
  onChangeCurrency,
  onBack,
}: {
  topInset: number;
  colors: ReturnType<typeof useColors>;
  autoFilled: AutoFilledData;
  selectedCurrency: Currency;
  onProceed: () => void;
  onRescan: () => void;
  onChangeCurrency: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const currency = autoFilled.currency ?? selectedCurrency;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Ready to Fill
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}
      >
        <View
          style={[
            styles.successBanner,
            { backgroundColor: colors.success + "18", borderColor: colors.success + "40" },
          ]}
        >
          <Feather name="check-circle" size={20} color={colors.success} />
          <Text style={[styles.successBannerText, { color: colors.success }]}>
            Receipt scanned successfully
          </Text>
        </View>

        {autoFilled.photo ? (
          <Image
            source={{ uri: autoFilled.photo.startsWith("file://") ? autoFilled.photo : `file://${autoFilled.photo}` }}
            style={[styles.receiptPreview, { borderColor: colors.border }]}
            contentFit="contain"
          />
        ) : null}

        <View
          style={[
            styles.detectionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.detectionTitle, { color: colors.foreground }]}>
            Will auto-fill these fields
          </Text>

          <DetectionRow
            label="Currency"
            value={currency}
            icon="dollar-sign"
            colors={colors}
          />
          {autoFilled.amount && (
            <DetectionRow
              label="Amount"
              value={autoFilled.amount}
              icon="hash"
              colors={colors}
            />
          )}
          {autoFilled.date && (
            <DetectionRow
              label="Date"
              value={autoFilled.date}
              icon="calendar"
              colors={colors}
            />
          )}
        </View>

        <View
          style={[styles.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}
        >
          <Feather name="info" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Auto-filled fields will be highlighted. Always review values before saving.
          </Text>
        </View>

        <TouchableOpacity
          onPress={onProceed}
          style={[styles.approveBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="arrow-right" size={18} color="#fff" />
          <Text style={styles.approveBtnText}>Open Expense Form</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            onPress={onChangeCurrency}
            style={[
              styles.secondaryBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="edit-2" size={14} color={colors.foreground} />
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
              Change Currency
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRescan}
            style={[
              styles.secondaryBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="refresh-cw" size={14} color={colors.foreground} />
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
              Scan Again
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (uri: string) => Promise<void>;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const colors = useColors();

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) setCapturedUri(photo.uri);
    } finally {
      setCapturing(false);
    }
  }

  async function handleConfirm() {
    if (!capturedUri) return;
    setConfirming(true);
    try {
      await onCapture(capturedUri);
    } finally {
      setConfirming(false);
    }
  }

  if (!permission) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: "#000" }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: "#000" }]}>
        <Feather name="camera-off" size={48} color="#fff" style={{ marginBottom: 16 }} />
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center", marginBottom: 24, paddingHorizontal: 32 }}>
          Camera access is required to scan receipts.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={[styles.approveBtn, { backgroundColor: "#fff", marginBottom: 12 }]}
        >
          <Text style={{ color: "#000", fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
            Allow Camera
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel}>
          <Text style={{ color: "#aaa", fontSize: 15 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capturedUri) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <Image
          source={{ uri: capturedUri }}
          style={{ flex: 1 }}
          contentFit="contain"
        />
        <View
          style={[
            styles.cameraActions,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          <TouchableOpacity
            onPress={() => setCapturedUri(null)}
            style={[styles.cameraSecondaryBtn, { borderColor: "#fff" }]}
          >
            <Feather name="refresh-cw" size={18} color="#fff" />
            <Text style={styles.cameraSecondaryBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={confirming}
            style={[styles.cameraPrimaryBtn, { backgroundColor: colors.primary }]}
          >
            {confirming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="check" size={20} color="#fff" />
                <Text style={styles.cameraPrimaryBtnText}>Use Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
        <View style={[styles.cameraOverlay, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onCancel} style={styles.cameraCloseBtn}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.receiptGuide}>
            <View style={[styles.guideCorner, styles.guideTopLeft]} />
            <View style={[styles.guideCorner, styles.guideTopRight]} />
            <View style={[styles.guideCorner, styles.guideBottomLeft]} />
            <View style={[styles.guideCorner, styles.guideBottomRight]} />
            <Text style={styles.guideText}>Align receipt within the frame</Text>
          </View>
        </View>
      </CameraView>
      <View style={[styles.cameraActions, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          style={[styles.cameraSecondaryBtn, { borderColor: "#fff" }]}
        >
          <Feather name="refresh-cw" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCapture}
          disabled={capturing}
          style={styles.captureBtn}
        >
          {capturing ? (
            <ActivityIndicator color="#000" />
          ) : (
            <View style={styles.captureBtnInner} />
          )}
        </TouchableOpacity>
        <View style={{ width: 52 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  content: { padding: 16, gap: 12 },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  analyzingText: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginTop: 16 },
  analyzingSubText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
  introText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 4 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  optionDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  receiptPreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  detectionCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    padding: 16,
    gap: 4,
  },
  detectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  confidenceDot: { width: 6, height: 6, borderRadius: 3 },
  confidenceLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  detectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  detectionRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  detectionRowLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  detectionRowValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  confirmPrompt: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, textAlign: "center" },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  approveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  changeBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  currencyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  currencyOptionText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  noResults: { padding: 32, textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular" },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  successBannerText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  secondaryActions: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  cameraOverlay: { flex: 1, justifyContent: "space-between", paddingBottom: 16 },
  cameraCloseBtn: {
    alignSelf: "flex-end",
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptGuide: {
    marginHorizontal: 32,
    height: 280,
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  guideCorner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#fff",
  },
  guideTopLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  guideTopRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  guideBottomLeft: { bottom: 30, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  guideBottomRight: { bottom: 30, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  guideText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cameraActions: {
    backgroundColor: "rgba(0,0,0,0.85)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
  },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
  },
  cameraSecondaryBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  cameraSecondaryBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_500Medium" },
  cameraPrimaryBtn: {
    flex: 1,
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cameraPrimaryBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
