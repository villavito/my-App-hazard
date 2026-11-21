// Expo config plugin: on Windows, put every module's native (CMake) build
// folder under %USERPROFILE%\.cxx\<module> instead of
// node_modules\<lib>\android\.cxx.
//
// Why: react-native-reanimated's object files end up at
//   <project>\node_modules\react-native-reanimated\android\.cxx\RelWithDebInfo\<hash>\<abi>\
//     CMakeFiles\reanimated.dir\C_\<project>\node_modules\react-native-reanimated\Common\...\X.cpp.o
// which passes Windows' path limit when the project lives somewhere like
// C:\Users\<name>\Desktop\<project>, and the build fails with
//   ninja: error: mkdir(...): No such file or directory
// The SDK's ninja (1.10) can't use long paths even with LongPathsEnabled, so
// the build folder is shortened instead. Other OSes are left untouched.
//
// Injected into settings.gradle (gradle.beforeProject), not the root
// build.gradle: some library projects are configured before the root build
// script runs, and by then AGP refuses the change ("too late to set
// buildStagingDirectory").
const { withSettingsGradle } = require("expo/config-plugins");

const MARKER = "// @generated withShortNativeBuildPath";

const SNIPPET = `
${MARKER}
if (System.getProperty("os.name").toLowerCase().contains("windows")) {
    def shortCxxRoot = new File(System.getProperty("user.home"), ".cxx")
    gradle.beforeProject { p ->
        ["com.android.library", "com.android.application"].each { pluginId ->
            p.plugins.withId(pluginId) {
                p.android.externalNativeBuild.cmake.buildStagingDirectory =
                    new File(shortCxxRoot, p.name)
            }
        }
    }
}
`;

module.exports = function withShortNativeBuildPath(config) {
  return withSettingsGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error("withShortNativeBuildPath only supports a Groovy settings.gradle");
    }
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents += SNIPPET;
    }
    return cfg;
  });
};
