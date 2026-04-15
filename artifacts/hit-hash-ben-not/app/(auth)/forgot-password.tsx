import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // TODO: Supabase reset-password call
      console.log("Reset:", email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        {sent ? (
          /* ── Success state ── */
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>📬</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Check your inbox
            </Text>
            <Text
              style={[styles.successMessage, { color: colors.mutedForeground }]}
            >
              Check your email for a reset link. It may take a minute to arrive.
            </Text>
            <Button
              label="Back to sign in"
              variant="secondary"
              onPress={() => router.replace("/(auth)/sign-in")}
              style={styles.backToSignInBtn}
            />
          </View>
        ) : (
          /* ── Default state ── */
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Forgot password?
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Enter your email and we'll send you a reset link.
            </Text>

            <View style={styles.form}>
              <TextField
                label="Email"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="you@example.com"
                error={error}
              />
            </View>

            <Button
              label={loading ? "Sending…" : "Send reset email"}
              onPress={handleSend}
              disabled={loading}
              style={styles.submitBtn}
            />

            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.footerBtn}
            >
              <Text
                style={[styles.footerText, { color: colors.mutedForeground }]}
              >
                Back to{" "}
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  sign in
                </Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  backBtn: {
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 36,
  },
  form: {
    marginBottom: 32,
  },
  submitBtn: {
    width: "100%",
    marginBottom: 24,
  },
  footerBtn: {
    alignSelf: "center",
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  footerLink: {
    fontFamily: "Inter_500Medium",
  },
  /* Success */
  successContainer: {
    alignItems: "center",
    paddingTop: 32,
    gap: 16,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 23,
  },
  backToSignInBtn: {
    width: "100%",
    marginTop: 8,
  },
});
