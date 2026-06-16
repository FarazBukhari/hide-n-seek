import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bukhari.wheresburhan",
  appName: "Where's Burhan",
  // The Vite build output; Capacitor copies this into the Android app.
  webDir: "dist",
  android: {
    // Debug APKs are fine for sideloading to family phones.
    buildOptions: {},
  },
};

export default config;
