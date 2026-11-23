import { useSyncExternalStore } from "react";
import { Appearance } from "react-native";

const subscribe = (onChange: () => void) => {
  const subscription = Appearance.addChangeListener(onChange);
  return () => subscription.remove();
};
const getColorScheme = () => Appearance.getColorScheme();
// The web build's pages are drawn ahead of time, in light mode.
const getPrebuiltColorScheme = () => "light" as const;

/**
 * react-native's useColorScheme, made safe for the web's pre-built pages.
 *
 * React's version reports dark mode on the very first draw in the browser.
 * That draw has to match the pre-built light page, and when it doesn't, React
 * leaves the pre-built light colours on screen - which left the tab bar white
 * on dark-mode phones. This reports "light" for that first draw and the
 * phone's real setting straight after, so the colours update properly. On the
 * phone app there is no pre-built page, so it simply reports the real setting.
 */
export function useColorScheme() {
  return useSyncExternalStore(subscribe, getColorScheme, getPrebuiltColorScheme);
}
