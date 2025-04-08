import 'dotenv/config';

export default {
  expo: {
    name: "RawConnect",
    slug: "RawConnect",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      "userInterfaceStyle": "automatic"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.amedina53.RawConnect",
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiKey: process.env.API_KEY || "",
      authDomain: process.env.AUTH_DOMAIN || "",
      projectId: process.env.PROJECT_ID || "",
      storageBucket: process.env.STORAGE_BUCKET || "",
      messagingSenderId: process.env.MESSAGING_SENDER_ID || "",
      appId: process.env.APP_ID || "",
      eas: {
        projectId: "b63c7a4d-96e4-4f52-ad6f-ad59d2070237"
      }
    }
  }
};
