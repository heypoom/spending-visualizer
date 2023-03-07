import path from "path"
import { defineConfig } from "vite"

import solidPlugin from "vite-plugin-solid"
import WindiCSS from "vite-plugin-windicss"

export default defineConfig({
  plugins: [solidPlugin(), WindiCSS()],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
  resolve: {
    alias: {
      "@parser": path.resolve(__dirname, "../../packages/parser"),
    },
  },
})
