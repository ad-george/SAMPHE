import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5176, // ✅ Make sure this matches your running port
    host: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000", // ✅ http, not https
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: { "@": path.resolve(__dirname, "./src") },
//   },
//   server: {
//     port: 5176,
//     host: true,
//     allowedHosts: true,
//     proxy: {
//       "/api": {
//         target: "http://localhost:5000",
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
//   build: {
//     outDir: "dist",
//     sourcemap: false,
//   },
// });
