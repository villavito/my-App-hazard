import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { inferAgencyFromEmail } from "../constants/agencies";
import { createUserWithRole } from "../services/authService";
import { showAlert } from "../utils/crossPlatformAlert";
import { dashboardRouteFor } from "../utils/dashboardRoute";
import {
  formatMobile,
  isValidMobile,
  mobileDigits,
  mobileErrorMessage,
  toE164Mobile,
} from "../utils/phoneNumber";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_NAME_LENGTH = 2;

// All required before the account can be created.
const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { key: "upper", label: "An uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower", label: "A lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { key: "number", label: "A number (0-9)", test: (p: string) => /\d/.test(p) },
] as const;

const STRENGTH_LEVELS = [
  { label: "Too weak", color: "#FF3B30" },
  { label: "Weak", color: "#FF3B30" },
  { label: "Fair", color: "#FF9500" },
  { label: "Good", color: "#34C759" },
  { label: "Strong", color: "#1E9E45" },
] as const;

// Index into STRENGTH_LEVELS. Missing any required rule is "Weak"; meeting
// them all is "Fair", and a symbol and/or 12+ characters raise it to
// "Good" / "Strong".
function passwordStrength(password: string) {
  if (!password) return 0;
  if (!PASSWORD_RULES.every((rule) => rule.test(password))) return 1;
  let score = 2;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;
  return score;
}

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Just the 10 digits after +63.
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const trimmedEmailLower = email.trim().toLowerCase();

  // Live validation. Name/email/mobile errors wait until the field is left
  // once, so the user isn't told "invalid" while still typing.
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    mobile: false,
  });
  const nameValid = name.trim().length >= MIN_NAME_LENGTH;
  const emailValid = EMAIL_PATTERN.test(trimmedEmailLower);
  const mobileValid = isValidMobile(mobile);
  const passwordChecks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));
  const passwordValid = passwordChecks.every((rule) => rule.passed);
  const strength = passwordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const formValid =
    nameValid && emailValid && mobileValid && passwordValid && passwordsMatch;

  const showNameError = touched.name && !nameValid;
  const showEmailError = touched.email && email.trim().length > 0 && !emailValid;
  const showMatchError = confirmPassword.length > 0 && !passwordsMatch;
  const showMobileError = touched.mobile && !mobileValid;
  const mobileError = mobileErrorMessage(mobile);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#fff",
    },
    content: {
      flexGrow: 1,
      justifyContent: "space-between",
      paddingVertical: 24,
    },
    header: {
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    title: {
      fontSize: 34,
      fontWeight: "800",
      color: isDark ? "#fff" : "#111",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 24,
      color: isDark ? "#aaa" : "#555",
    },
    form: {
      paddingHorizontal: 24,
    },
    inputGroup: {
      marginBottom: 18,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#111",
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? "#1f1f1f" : "#f4f5f7",
      padding: 16,
      borderRadius: 14,
      fontSize: 16,
      color: isDark ? "#fff" : "#111",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#e0e0e0",
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1f1f1f" : "#f4f5f7",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#e0e0e0",
      borderRadius: 14,
    },
    passwordInput: {
      flex: 1,
      padding: 16,
      fontSize: 16,
      color: isDark ? "#fff" : "#111",
    },
    eyeIcon: {
      paddingHorizontal: 16,
      color: isDark ? "#888" : "#666",
    },
    button: {
      backgroundColor: "#007AFF",
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
      marginTop: 8,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 18,
      alignItems: "center",
    },
    footerText: {
      color: isDark ? "#aaa" : "#666",
      fontSize: 14,
    },
    footerLink: {
      color: "#007AFF",
      fontSize: 14,
      fontWeight: "700",
    },
    inputValid: {
      borderColor: "#34C759",
    },
    inputInvalid: {
      borderColor: "#FF3B30",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusIcon: {
      position: "absolute",
      right: 14,
    },
    helperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },
    helperText: {
      fontSize: 13,
      color: isDark ? "#aaa" : "#666",
    },
    errorText: {
      fontSize: 13,
      color: "#FF3B30",
    },
    successText: {
      fontSize: 13,
      color: "#34C759",
    },
    strengthRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
    },
    strengthBar: {
      flex: 1,
      flexDirection: "row",
      gap: 4,
    },
    strengthSegment: {
      flex: 1,
      height: 5,
      borderRadius: 3,
      backgroundColor: isDark ? "#333" : "#e0e0e0",
    },
    strengthLabel: {
      fontSize: 13,
      fontWeight: "700",
      minWidth: 64,
      textAlign: "right",
    },
    ruleList: {
      marginTop: 8,
      gap: 4,
    },
    phonePrefix: {
      paddingLeft: 16,
      paddingRight: 12,
      paddingVertical: 16,
      borderRightWidth: 1,
      borderRightColor: isDark ? "#333" : "#e0e0e0",
    },
    phonePrefixText: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#fff" : "#111",
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      showAlert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Error", "Passwords do not match");
      return;
    }

    if (!nameValid) {
      showAlert("Error", "Please enter your full name.");
      return;
    }

    if (!emailValid) {
      showAlert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!mobileValid) {
      showAlert("Invalid Mobile Number", mobileError);
      return;
    }

    if (!passwordValid) {
      showAlert(
        "Weak Password",
        "Your password needs at least 8 characters, an uppercase letter, a lowercase letter, and a number.",
      );
      return;
    }

    let assignedRole: "user" | "admin" | "super_admin" = "user";

    if (trimmedEmailLower.endsWith("@superadmin.com")) {
      assignedRole = "super_admin";
    } else if (trimmedEmailLower.endsWith("@admin.com")) {
      assignedRole = "admin";
    }

    setLoading(true);

    try {
      // An admin's agency comes from its email (e.g. ldrrmc01@admin.com ->
      // LDRRMC), which also makes that agency selectable on the citizens'
      // report screen straight away. An address that names no agency gets
      // none - a super admin assigns it from the Super Admin dashboard.
      const result = await createUserWithRole(
        trimmedEmailLower,
        password,
        name.trim(),
        assignedRole,
        assignedRole === "admin"
          ? inferAgencyFromEmail(trimmedEmailLower)
          : undefined,
        toE164Mobile(mobile),
      );
      if (result.success && result.user) {
        const route = dashboardRouteFor(result.user.role);

        showAlert("Success", "Account created successfully!", [
          { text: "OK", onPress: () => router.replace(route) },
        ]);
      } else {
        // Handle specific Firebase error codes with user-friendly messages
        const errorMessage = result.error || "";
        if (errorMessage.includes("auth/email-already-in-use")) {
          showAlert(
            "Account Already Exists",
            "This email address is already registered. Would you like to sign in instead?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Sign In", onPress: () => router.replace("/login") },
            ],
          );
        } else if (errorMessage.includes("auth/weak-password")) {
          showAlert(
            "Weak Password",
            "Password must be at least 8 characters with an uppercase letter, a lowercase letter, and a number.",
          );
        } else if (errorMessage.includes("auth/invalid-email")) {
          showAlert("Invalid Email", "Please enter a valid email address.");
        } else if (errorMessage.includes("auth/operation-not-allowed")) {
          showAlert(
            "Error",
            "Email/password accounts are not enabled. Please contact support.",
          );
        } else {
          showAlert("Signup Error", result.error || "Unable to create account");
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || "";
      if (errorMessage.includes("auth/email-already-in-use")) {
        showAlert(
          "Account Already Exists",
          "This email address is already registered. Would you like to sign in instead?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sign In", onPress: () => router.replace("/login") },
          ],
        );
      } else if (errorMessage.includes("auth/weak-password")) {
        showAlert("Weak Password", "Password must be at least 8 characters with an uppercase letter, a lowercase letter, and a number.");
      } else if (errorMessage.includes("auth/invalid-email")) {
        showAlert("Invalid Email", "Please enter a valid email address.");
      } else {
        showAlert("Signup Error", error?.message || "Unable to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create an account</Text>
            <Text style={styles.subtitle}>
              Sign up to access incident reporting, dashboard views, and secure
              account features.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, paddingRight: 44 },
                    showNameError && styles.inputInvalid,
                    nameValid && styles.inputValid,
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={name}
                  // Pasted line breaks would stretch the field on Android.
                  onChangeText={(text) => setName(text.replace(/[\r\n]+/g, " "))}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  multiline={false}
                  numberOfLines={1}
                />
                {nameValid ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#34C759"
                    style={styles.statusIcon}
                  />
                ) : null}
              </View>
              {showNameError ? (
                <Text style={[styles.errorText, { marginTop: 6 }]}>
                  Please enter your full name.
                </Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, paddingRight: 44 },
                    showEmailError && styles.inputInvalid,
                    emailValid && styles.inputValid,
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={email}
                  // Emails never contain whitespace; stripping it also stops
                  // pasted multi-line text from stretching the field on Android.
                  onChangeText={(text) => setEmail(text.replace(/\s/g, ""))}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  multiline={false}
                  numberOfLines={1}
                />
                {emailValid ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#34C759"
                    style={styles.statusIcon}
                  />
                ) : null}
              </View>
              {showEmailError ? (
                <Text style={[styles.errorText, { marginTop: 6 }]}>
                  Enter a valid email address, e.g. juan@gmail.com
                </Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <View
                style={[
                  styles.passwordContainer,
                  showMobileError && styles.inputInvalid,
                  mobileValid && styles.inputValid,
                ]}
              >
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>🇵🇭 +63</Text>
                </View>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="917 123 4567"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={formatMobile(mobile)}
                  onChangeText={(text) => setMobile(mobileDigits(text))}
                  onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  maxLength={14}
                  multiline={false}
                  numberOfLines={1}
                />
                {mobileValid ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#34C759"
                    style={{ marginRight: 14 }}
                  />
                ) : null}
              </View>
              {showMobileError ? (
                <Text style={[styles.errorText, { marginTop: 6 }]}>
                  {mobileError}
                </Text>
              ) : (
                <Text style={[styles.helperText, { marginTop: 6 }]}>
                  Responders may call this number about your reports.
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.passwordContainer,
                  passwordValid && styles.inputValid,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a password"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  multiline={false}
                  numberOfLines={1}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    style={styles.eyeIcon}
                  />
                </TouchableOpacity>
              </View>

              {password.length > 0 ? (
                <>
                  <View style={styles.strengthRow}>
                    <View style={styles.strengthBar}>
                      {[1, 2, 3, 4].map((segment) => (
                        <View
                          key={segment}
                          style={[
                            styles.strengthSegment,
                            segment <= strength && {
                              backgroundColor: STRENGTH_LEVELS[strength].color,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.strengthLabel,
                        { color: STRENGTH_LEVELS[strength].color },
                      ]}
                    >
                      {STRENGTH_LEVELS[strength].label}
                    </Text>
                  </View>
                  <View style={styles.ruleList}>
                    {passwordChecks.map((rule) => (
                      <View key={rule.key} style={styles.helperRow}>
                        <Ionicons
                          name={
                            rule.passed ? "checkmark-circle" : "ellipse-outline"
                          }
                          size={16}
                          color={
                            rule.passed ? "#34C759" : isDark ? "#666" : "#aaa"
                          }
                        />
                        <Text
                          style={
                            rule.passed ? styles.successText : styles.helperText
                          }
                        >
                          {rule.label}
                        </Text>
                      </View>
                    ))}
                    {passwordValid && strength < 4 ? (
                      <Text style={[styles.helperText, { marginTop: 2 }]}>
                        Tip: add a symbol (!@#) or use 12+ characters to make
                        it stronger.
                      </Text>
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View
                style={[
                  styles.passwordContainer,
                  showMatchError && styles.inputInvalid,
                  passwordsMatch && styles.inputValid,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  multiline={false}
                  numberOfLines={1}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={24}
                    style={styles.eyeIcon}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 ? (
                <View style={styles.helperRow}>
                  <Ionicons
                    name={passwordsMatch ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={passwordsMatch ? "#34C759" : "#FF3B30"}
                  />
                  <Text
                    style={passwordsMatch ? styles.successText : styles.errorText}
                  >
                    {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!formValid || loading) && styles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={!formValid || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text
                style={styles.footerLink}
                onPress={() => router.push("/login")}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
