import { defineConfig } from "vite-plugin-windicss"

export default defineConfig({
  darkMode: false,
  theme: {
    fontFamily: {
      sans: ["Inter", "IBM Plex Sans Thai"],
    },
    extend: {},
  },
})
