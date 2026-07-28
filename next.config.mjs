import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    // Permet `@use "variables" as *;` depuis n'importe quel SCSS co-localisé
    // (atomic design), sans chemin relatif fragile.
    includePaths: [path.join(__dirname, "src/styles")],
  },
};

export default nextConfig;
