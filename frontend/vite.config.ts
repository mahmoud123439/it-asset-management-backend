import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig } from "vite";

const certificateDirectory = path.join(
  process.env.LOCALAPPDATA || os.homedir(),
  "it-asset-management",
  "certificates",
);
const certificatePath = path.join(certificateDirectory, "smart-it.local.crt");
const privateKeyPath = path.join(certificateDirectory, "smart-it.local.key");

if (!fs.existsSync(certificatePath) || !fs.existsSync(privateKeyPath)) {
  throw new Error(
    "Local HTTPS certificate not found. Run `npm run setup:https` from the frontend directory.",
  );
}

export default defineConfig({
  server: {
    host: "127.0.0.1",
    allowedHosts: ["smart-it.local"],
    port: 5174,
    strictPort: true,
    https: {
      cert: fs.readFileSync(certificatePath),
      key: fs.readFileSync(privateKeyPath),
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
