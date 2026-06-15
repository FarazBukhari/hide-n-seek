import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Relative base so the same build works on GitHub Pages (served from a
// /repo-name/ subpath) and inside the Capacitor Android webview later (M6).
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    assetsInlineLimit: 0,
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "Where's Burhan?",
        short_name: "Burhan",
        description: "A wordless hide-and-seek game.",
        theme_color: "#1a1030",
        background_color: "#1a1030",
        display: "fullscreen",
        orientation: "landscape",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
