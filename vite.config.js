import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // local ağdaki telefonların erişebilmesi için
    port: 5173,
  },
});
