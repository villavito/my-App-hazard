import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
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
import { getAuthInstance } from "../config/firebase";
import { showAlert } from "../utils/crossPlatformAlert";

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f5f5f5",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0",
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    infoCard: {
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
      borderRadius: 14,
      padding: 20,
      marginBottom: 20,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginBottom: 12,
    },
    infoText: {
      fontSize: 14,
      color: isDark ? "#ccc" : "#555",
      lineHeight: 22,
      marginBottom: 12,
    },
    stepContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#007AFF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 2,
    },
    stepNumberText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 4,
    },
    stepText: {
      fontSize: 13,
      color: isDark ? "#aaa" : "#666",
      lineHeight: 20,
    },
    warningBox: {
      backgroundColor: isDark ? "#3a2a1a" : "#FFF3E0",
      padding: 16,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: 12,
    },
    warningIcon: {
      marginRight: 10,
      marginTop: 2,
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      color: isDark ? "#FFB74D" : "#E65100",
      lineHeight: 20,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa",
      padding: 14,
      borderRadius: 12,
      fontSize: 15,
      color: isDark ? "#fff" : "#000",
      borderWidth: 1,
      borderColor: isDark ? "#444" : "#e0e0e0",
    },
    button: {
      backgroundColor: "#007AFF",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });

  const handleSendReset = async () => {
    if (!email.trim()) {
      showAlert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(
        getAuthInstance(),
        email.trim().toLowerCase(),
      );
      showAlert(
        "Reset Email Sent",
        "A password reset link has been sent to your email. Please check your inbox and follow the instructions.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      let message = "Failed to send reset email";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/user-not-found":
            message = "No account found with this email";
            break;
          case "auth/too-many-requests":
            message = "Too many attempts. Please try again later";
            break;
          default:
            message = error.message;
        }
      }
      showAlert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to change your password</Text>
            <Text style={styles.infoText}>
              To ensure the security of your account, we use a password reset
              email system. Follow the steps below:
            </Text>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Enter your email</Text>
                <Text style={styles.stepText}>
                  Provide the email address associated with your account below.
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Check your inbox</Text>
                <Text style={styles.stepText}>
                  We&apos;ll send a password reset link to your email. It may take a
                  few minutes to arrive.
                </Text>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Create new password</Text>
                <Text style={styles.stepText}>
                  Click the link in the email and create a new strong password
                  for your account.
                </Text>
              </View>
            </View>

            <View style={styles.warningBox}>
              <Ionicons
                name="warning-outline"
                size={20}
                color={isDark ? "#FFB74D" : "#E65100"}
                style={styles.warningIcon}
              />
              <Text style={styles.warningText}>
                Make sure your new password is at least 6 characters long and
                includes a mix of letters, numbers, and symbols for better
                security.
              </Text>
            </View>
          </View>

          {/* Reset Form */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Send Reset Link</Text>
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
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Email</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
