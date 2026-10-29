
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  preview: {
    host: "0.0.0.0",
    allowedHosts: ["bingo-frontend-ovn3.onrender.com"],
    headers: {
      "Cache-Control": "no-store",
    },
  },
});
