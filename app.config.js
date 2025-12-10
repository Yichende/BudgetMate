import 'dotenv/config';

export default ({ config }) => ({
  ...config,

  expo: {
    name: "BudgetMate",
    slug: "BudgetMate",
    version: "1.0.0",
    orientation: "portrait",

    icon: "./assets/images/icon.png",
    scheme: "budgetmate",
    userInterfaceStyle: "automatic",

    newArchEnabled: false,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yichend.budgetmate",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },

    android: {
      newArchEnabled: false,
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.yichend.budgetmate",
      cleartextTrafficEnabled: true
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/icon.png"
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-sqlite"
    ],

    experiments: {
      typedRoutes: true
    },

    extra: {
      router: { origin: false },
      apiBaseURL: process.env.EXPO_PUBLIC_API_BASE_URL,

      eas: {
        projectId: "326fcfd7-518d-4320-abc2-843102eebfb4"
      }
    },

    owner: "yichend"
  }
});
