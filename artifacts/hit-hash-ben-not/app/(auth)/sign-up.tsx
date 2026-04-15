import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { isValidNiche, type NicheId } from "./niches";

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ niche?: string }>();
  const niche: NicheId = isValidNiche(params.niche) ? params.niche : "general";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  function validate(): boolean {
    let valid = true;

    if (!email.trim() || !email.includes("@")) {
      setEmailError("Enter a valid email address.");
      valid = false;
    } else {
      setEmailError("");
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      valid = false;
    } else {
      setConfirmError("");
    }

    return valid;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: Supabase sign-up call
      console.log("Sign up:", email);
      router.push({ pathname: "/(auth)/onboarding", params: { niche } });
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

        <Text style={[styles.title, { color: colors.foreground }]}>
          Create account
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Start tracking your expenses in minutes.
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setEmailError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="you@example.com"
            error={emailError}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setPasswordError("");
            }}
            secureTextEntry
            placeholder="At least 8 characters"
            error={passwordError}
          />
          <TextField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              setConfirmError("");
            }}
            secureTextEntry
            placeholder="Repeat your password"
            error={confirmError}
          />
        </View>

        <Button
          label={loading ? "Creating account…" : "Create account"}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitBtn}
        />

        <TouchableOpacity
          onPress={() => router.replace("/(auth)/sign-in")}
          hitSlop={8}
          style={styles.footerBtn}
        >
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Already have an account?{" "}
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Sign in
            </Text>
          </Text>
        </TouchableOpacity>
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
    gap: 20,
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
});
