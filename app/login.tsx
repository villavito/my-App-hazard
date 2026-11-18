import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import Constants, { AppOwnership } from "expo-constants";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import {
  friendlyAuthError,
  signInUser,
  signInWithGoogleToken,
  signInWithGooglePopup,
} from "../services/authService";
import { showAlert } from "../utils/crossPlatformAlert";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, refreshUserRole } = useAuth();
  const [googleRequest, googleResponse, promptGoogleSignIn] =
    Google.useIdTokenAuthRequest({
      iosClientId:
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
        "ios-client-id-not-configured",
      androidClientId:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ??
        "android-client-id-not-configured",
      webClientId:
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
        "web-client-id-not-configured",
    }, {
      native: "incident-reporting-app:/oauthredirect",
      scheme: "incident-reporting-app",
    });
  const hasGoogleClientId =
    Platform.OS === "ios"
      ? Boolean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
      : Platform.OS === "android"
        ? Boolean(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID)
        : Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
  const isExpoGo = Constants.appOwnership === AppOwnership.Expo;
  const handledGoogleResponse = useRef<object | null>(null);
  const autoPromptStarted = useRef(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000000" : "#f8f9fa",
    },
    header: {
      padding: 20,
      paddingTop: 40,
      alignItems: "center",
    },
    logo: {
      fontSize: 48,
      fontWeight: "bold",
      color: "#007AFF",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? "#888" : "#666",
      marginBottom: 40,
    },
    form: {
      paddingHorizontal: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa",
      padding: 16,
      borderRadius: 12,
      fontSize: 16,
      color: isDark ? "#fff" : "#000",
      borderWidth: 1,
      borderColor: isDark ? "#444" : "#e0e0e0",
    },
    button: {
      backgroundColor: "#007AFF",
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 20,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
    signupContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 20,
    },
    signupText: {
      color: isDark ? "#888" : "#666",
      fontSize: 14,
    },
    signupLink: {
      color: "#007AFF",
      fontSize: 14,
      fontWeight: "600",
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa",
      borderWidth: 1,
      borderColor: isDark ? "#444" : "#e0e0e0",
      borderRadius: 12,
    },
    passwordInput: {
      flex: 1,
      padding: 16,
      fontSize: 16,
      color: isDark ? "#fff" : "#000",
    },
    eyeIcon: {
      padding: 16,
      color: isDark ? "#888" : "#666",
    },
    forgotPasswordLink: {
      alignSelf: "flex-end",
      marginTop: 8,
    },
    forgotPasswordText: {
      color: "#007AFF",
      fontSize: 14,
      fontWeight: "600",
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? "#444" : "#ddd",
    },
    dividerText: {
      marginHorizontal: 12,
      color: isDark ? "#888" : "#666",
      fontSize: 14,
    },
    googleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#2a2a2a" : "#fff",
      borderWidth: 1,
      borderColor: isDark ? "#444" : "#ddd",
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 16,
    },
    googleButtonText: {
      color: isDark ? "#fff" : "#222",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 10,
    },
    googleSetupText: {
      color: isDark ? "#aaa" : "#666",
      fontSize: 13,
      textAlign: "center",
      marginTop: 10,
    },
  });

  const navigateByRole = useCallback(
    (role: "user" | "admin" | "super_admin") => {
      if (role === "super_admin") {
        router.push("/admin/super-admin");
      } else if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/(tabs)");
      }
    },
    [router],
  );

  const startGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setGoogleLoading(true);
    try {
      const result = await promptGoogleSignIn();
      if (result.type !== "success") {
        setLoading(false);
        setGoogleLoading(false);
        if (result.type === "error") {
          showAlert(
            "Google Sign-In Error",
            result.error?.description || "Google sign-in was not completed.",
          );
        }
      }
    } catch (error: any) {
      setLoading(false);
      setGoogleLoading(false);
      showAlert(
        "Google Sign-In Error",
        friendlyAuthError(error?.code, error?.message),
      );
    }
  }, [promptGoogleSignIn]);

  useEffect(() => {
    if (
      Platform.OS === "web" ||
      isExpoGo ||
      authLoading ||
      user ||
      !hasGoogleClientId ||
      !googleRequest ||
      autoPromptStarted.current
    ) {
      return;
    }

    const timer = setTimeout(() => {
      if (autoPromptStarted.current) return;
      autoPromptStarted.current = true;
      void startGoogleSignIn();
    }, 0);

    return () => clearTimeout(timer);
  }, [
    authLoading,
    googleRequest,
    hasGoogleClientId,
    isExpoGo,
    startGoogleSignIn,
    user,
  ]);

  useEffect(() => {
    if (!googleResponse || handledGoogleResponse.current === googleResponse) {
      return;
    }
    handledGoogleResponse.current = googleResponse;

    void (async () => {
      if (googleResponse.type !== "success") return;

      const idToken = googleResponse.params.id_token;
      if (!idToken) {
        setLoading(false);
        setGoogleLoading(false);
        showAlert("Google Sign-In Error", "Google did not return an ID token.");
        return;
      }

      try {
        const result = await signInWithGoogleToken(idToken);
        if (result.success) {
          await refreshUserRole();
          navigateByRole(result.user.role);
        } else {
          showAlert("Google Sign-In Error", result.error);
        }
      } catch (error: any) {
        showAlert(
          "Google Sign-In Error",
          friendlyAuthError(error?.code, error?.message),
        );
      } finally {
        setLoading(false);
        setGoogleLoading(false);
      }
    })();
  }, [googleResponse, navigateByRole, refreshUserRole]);

  const handleGoogleLogin = () => {
    if (Platform.OS === "web") {
      setLoading(true);
      setGoogleLoading(true);
      void (async () => {
        try {
          const result = await signInWithGooglePopup();
          if (result.success) {
            await refreshUserRole();
            navigateByRole(result.user.role);
          } else if (
            !("code" in result) ||
            result.code !== "auth/popup-closed-by-user"
          ) {
            showAlert("Google Sign-In Error", result.error);
          }
        } catch (error: any) {
          showAlert(
            "Google Sign-In Error",
            friendlyAuthError(error?.code, error?.message),
          );
        } finally {
          setLoading(false);
          setGoogleLoading(false);
        }
      })();
      return;
    }

    if (isExpoGo) {
      showAlert(
        "Development Build Required",
        "Google sign-in can't return to the app from Expo Go. Run this app in a development build instead.",
      );
      return;
    }

    if (!hasGoogleClientId) {
      showAlert(
        "Google Sign-In Unavailable",
        "Configure the Google OAuth client ID for this platform.",
      );
      return;
    }

    if (!googleRequest) {
      showAlert(
        "Google Sign-In Unavailable",
        "Google sign-in is still loading. Please try again.",
      );
      return;
    }

    void startGoogleSignIn();
  };

  const handleLogin = async () => {
    console.log("handleLogin invoked", { email });
    if (!email || !password) {
      showAlert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await signInUser(email, password);

      if (result.success) {
        // Sign-in can fill in an admin's agency after AuthContext already
        // loaded the role, so reload it before the admin screens read it.
        await refreshUserRole();
        showAlert(
          "Success",
          `Welcome back! You are logged in as ${result.user.role}`,
        );
        // Navigate based on user role
        navigateByRole(result.user.role);
      } else {
        showAlert("Login Error", result.error || "Login failed");
      }
    } catch (error: any) {
      showAlert("Login Error", friendlyAuthError(error?.code, error?.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>WELCOME</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={isDark ? "#888" : "#999"}
            value={email}
            // Emails never contain whitespace; stripping it also stops pasted
            // multi-line text from stretching the field on Android.
            onChangeText={(text) => setEmail(text.replace(/\s/g, ""))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            multiline={false}
            numberOfLines={1}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={isDark ? "#888" : "#999"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              multiline={false}
              numberOfLines={1}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={() => router.push("/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={handleLogin}
          onPressIn={() =>
            console.log("Sign In button pressed (onPressIn)", { email })
          }
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[
            styles.googleButton,
            (loading ||
              (Platform.OS !== "web" &&
                (!googleRequest || !hasGoogleClientId))) &&
              styles.buttonDisabled,
          ]}
          onPress={handleGoogleLogin}
          disabled={
            loading ||
            (Platform.OS !== "web" &&
              (!googleRequest || !hasGoogleClientId))
          }
        >
          {googleLoading ? (
            <ActivityIndicator color={isDark ? "#fff" : "#222"} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>
        {Platform.OS !== "web" && isExpoGo ? (
          <Text style={styles.googleSetupText}>
            Google sign-in requires a development build; it cannot complete its
            OAuth redirect in Expo Go.
          </Text>
        ) : Platform.OS !== "web" && !hasGoogleClientId ? (
          <Text style={styles.googleSetupText}>
            Google sign-in needs OAuth client IDs for this platform.
          </Text>
        ) : null}

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
