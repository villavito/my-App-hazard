import { Ionicons } from "@expo/vector-icons";
import Constants, { AppOwnership } from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useState, useSyncExternalStore } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  type TurboModule,
  TurboModuleRegistry,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import {
  friendlyAuthError,
  signInUser,
  signInWithGooglePopup,
  signInWithGoogleToken,
} from "../services/authService";
import { showAlert } from "../utils/crossPlatformAlert";
import { isInAppBrowser, openInRealBrowser } from "../utils/inAppBrowser";

let googleSigninConfigured = false;

// The URL's ?google flag never changes while the page is open.
const subscribeToNothing = () => () => {};
const hasGoogleHandoffFlag = () =>
  Platform.OS === "web" &&
  new URLSearchParams(window.location.search).has("google");

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // True when Messenger/Facebook's built-in browser handed this screen over
  // to the real browser for Google sign-in (see handleGoogleLogin). The page
  // is pre-rendered at build time without the URL, hence the server value.
  const showGoogleHint = useSyncExternalStore(
    subscribeToNothing,
    hasGoogleHandoffFlag,
    () => false,
  );
  const router = useRouter();
  const { refreshUserRole } = useAuth();
  const isExpoGo = Constants.appOwnership === AppOwnership.Expo;
  const hasGoogleClientId =
    Platform.OS === "ios"
      ? Boolean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)
      : Platform.OS === "android"
        ? Boolean(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID)
        : Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
  const hasGoogleWebClientId = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  );

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
    googleHintText: {
      color: "#007AFF",
      fontSize: 15,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 16,
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

  const startNativeGoogleSignIn = useCallback(async () => {
    if (!TurboModuleRegistry.get<TurboModule>("RNGoogleSignin")) {
      showAlert(
        "Development Build Required",
        "This app build does not include Google Sign-In. Rebuild and reinstall the development or production app.",
      );
      return;
    }

    setLoading(true);
    setGoogleLoading(true);
    try {
      const googleSignIn =
        await import("@react-native-google-signin/google-signin");
      if (!googleSigninConfigured) {
        googleSignIn.GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
          ...(Platform.OS === "ios" &&
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
            ? {
                iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
              }
            : {}),
        });
        googleSigninConfigured = true;
      }

      await googleSignIn.GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await googleSignIn.GoogleSignin.signIn();
      if (!googleSignIn.isSuccessResponse(response)) return;

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error(
          "Google did not return an ID token. Check the Web OAuth client ID configuration.",
        );
      }

      const result = await signInWithGoogleToken(idToken);
      if (result.success) {
        await refreshUserRole();
        navigateByRole(result.user.role);
      } else {
        showAlert("Google Sign-In Error", result.error);
      }
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : undefined;
      showAlert(
        "Google Sign-In Error",
        friendlyAuthError(
          code,
          error instanceof Error
            ? error.message
            : "Google sign-in failed. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
      setGoogleLoading(false);
    }
  }, [navigateByRole, refreshUserRole]);

  const handleGoogleLogin = () => {
    if (Platform.OS === "web") {
      // Google refuses OAuth inside in-app browsers (Messenger, Facebook,
      // Instagram, LINE, TikTok...) and shows a bare "400 malformed" page, so
      // reopen this screen in the phone's real browser instead, where the
      // `google` flag tells the user to tap the button once more (the Google
      // popup needs a fresh tap there).
      if (isInAppBrowser()) {
        void openInRealBrowser("/login?google=1").then((handedOff) => {
          if (!handedOff) {
            showAlert(
              "Open in your browser",
              "Google sign-in doesn't work inside this app's built-in browser. Tap the ••• (or ⋮) menu at the top and choose \"Open in browser\" (Chrome or Safari), then tap Continue with Google again. You can also sign in with email and password here.",
            );
          }
        });
        return;
      }
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
        "Google sign-in on mobile requires this app's development or production build. Expo Go does not include the native Google Sign-In module.",
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

    if (!hasGoogleWebClientId) {
      showAlert(
        "Google Sign-In Unavailable",
        "Configure the Google Web OAuth client ID to enable Firebase sign-in.",
      );
      return;
    }

    void startNativeGoogleSignIn();
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

        {showGoogleHint ? (
          <Text style={styles.googleHintText}>
            Tap “Continue with Google” below to finish signing in.
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.googleButton,
            (loading || !hasGoogleClientId || !hasGoogleWebClientId) &&
              styles.buttonDisabled,
          ]}
          onPress={handleGoogleLogin}
          disabled={loading || !hasGoogleClientId || !hasGoogleWebClientId}
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
            Google sign-in requires the app&apos;s development or production
            build; it is not supported in Expo Go.
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
