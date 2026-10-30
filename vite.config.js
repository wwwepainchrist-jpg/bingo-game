import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  base: "/",

  plugins: [
    react(),

    legacy({
      targets: [
        "Chrome >= 80",
        "Edge >= 80",
        "Firefox >= 78",
        "Safari >= 13",
        "iOS >= 13",
        "Android >= 80"
      ],
      modernPolyfills: true
    })
  ],

  build: {
  minify: "esbuild",
  sourcemap: false
},

  preview: {
    host: "0.0.0.0",
    allowedHosts: ["bingo-frontend-ovn3.onrender.com"],
    headers: {
      "Cache-Control": "no-store"
    }
  }
});