import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"

/**
 * Configuración de la app móvil (archivo único).
 *
 * Deliberadamente NO usa Tailwind: la interfaz móvil se escribe con CSS propio
 * para controlar cada detalle y mantener el archivo lo más pequeño posible.
 *
 * nodePolyfills sí es necesario: @react-pdf/renderer depende de Buffer y process.
 */
export default defineConfig({
  root: fileURLToPath(new URL("./movil", import.meta.url)),
  base: "./",
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL("./dist-movil", import.meta.url)),
    emptyOutDir: true,
    // Una sola hoja de estilos y un solo bundle de JS: imprescindible para
    // poder incrustarlo todo en un único archivo HTML.
    cssCodeSplit: false,
    // Todo asset se incrusta como data: URI, sin archivos sueltos.
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      output: {
        // Un único bundle: sin división en chunks, para poder incrustarlo entero.
        codeSplitting: false,
        entryFileNames: "movil.js",
        assetFileNames: "movil.[ext]",
      },
    },
  },
})
