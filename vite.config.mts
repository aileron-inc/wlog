import { defineConfig } from "vite";
import RubyPlugin from "vite-plugin-ruby";
import reactSWC from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "url";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
  plugins: [reactSWC(), RubyPlugin(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./app/frontend", import.meta.url)),
    },
  },
  server: {
    hmr: {
      protocol: "ws",
      host: "localhost",
    },
    host: "localhost",
    port: Number(process.env.VITE_RUBY_PORT) || 8100,
    cors: true,
  },
});
