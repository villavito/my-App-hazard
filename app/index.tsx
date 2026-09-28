import { router } from "expo-router";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface GradientTextProps {
  children: React.ReactNode;
  style?: object;
}

const GradientText = ({ children, style }: GradientTextProps) => {
  return (
    <Text
      style={[
        {
          color: "#fff",
          // react-native-web deprecated the textShadow* props in favour of the
          // CSS shorthand, which native doesn't understand - so split by platform.
          ...Platform.select({
            web: { textShadow: "1px 1px 2px rgba(0,0,0,0.3)" },
            default: {
              textShadowColor: "rgba(0,0,0,0.3)",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            },
          }),
          letterSpacing: 1.5,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

export default function App() {
  function handleGetStarted() {
    router.push("/signup");
  }

  return (
    <View style={styles.gradient}>
      <Image
        source={require("../assets/images/logo-source.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <View style={styles.titleContainer}>
        <GradientText style={styles.title}>INCIDENT REPORTING APP</GradientText>
      </View>

      <Text style={[styles.paragraph, { fontSize: 13 }]}>
        Stay Alert. Stay Safe
      </Text>

      <Text style={[styles.paragraph, { fontSize: 9, marginTop: -20 }]}>
        identify incidents around you
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: "#1e193a", //background color sa
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    lineHeight: 32,
    fontWeight: "700",
    textTransform: "uppercase",
    marginHorizontal: 4,
    marginBottom: 8,
  },
  paragraph: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    width: "100%",
    maxWidth: 300,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  loginContainer: {
    marginTop: 16,
  },
  loginText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    textAlign: "center",
  },
  loginLink: {
    color: "#ffffff",
    textDecorationLine: "underline",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 30,
  },
});
