import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes all asset paths relative so the build works no matter
// what path it's served from on S3.
// outDir defaults to "dist" — same folder you already upload to S3.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
