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
import { createUserWithRole } from "../services/authService";
import { showAlert } from "../utils/crossPlatformAlert";

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const trimmedEmailLower = email.trim().toLowerCase();

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

    if (password.length < 6) {
      showAlert("Error", "Password must be at least 6 characters");
      return;
    }

    let assignedRole: "user" | "admin" | "super_admin" = "user";

    if (trimmedEmailLower.endsWith("@super_admin.com")) {
      assignedRole = "super_admin";
    } else if (trimmedEmailLower.endsWith("@admin.com")) {
      assignedRole = "admin";
    }

    setLoading(true);

    try {
      // Admin accounts created here have no agency - assign one afterward via
      // the Firestore console (users/{uid}.agency, one of the values in
      // constants/agencies.ts) so the account shows up in that agency's inbox.
      const result = await createUserWithRole(
        trimmedEmailLower,
        password,
        name.trim(),
        assignedRole,
      );
      if (result.success && result.user) {
        const selectedRole = result.user.role;
        const route =
          selectedRole === "super_admin"
            ? "/admin/super-admin"
            : selectedRole === "admin"
              ? "/admin/dashboard"
              : "/(tabs)";

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
            ]
          );
        } else if (errorMessage.includes("auth/weak-password")) {
          showAlert("Weak Password", "Password should be at least 6 characters.");
        } else if (errorMessage.includes("auth/invalid-email")) {
          showAlert("Invalid Email", "Please enter a valid email address.");
        } else if (errorMessage.includes("auth/operation-not-allowed")) {
          showAlert("Error", "Email/password accounts are not enabled. Please contact support.");
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
          ]
        );
      } else if (errorMessage.includes("auth/weak-password")) {
        showAlert("Weak Password", "Password should be at least 6 characters.");
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
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={isDark ? "#888" : "#999"}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={isDark ? "#888" : "#999"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a password"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
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
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
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
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSignup}
              disabled={loading}
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
