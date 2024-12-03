// vite.config.ts
import vue from "file:///Users/alexgaillard/Desktop/dev/monospace/directus/node_modules/.pnpm/@vitejs+plugin-vue@5.1.4_vite@5.2.11_@types+node@22.7.5_sass@1.79.4_terser@5.31.6__vue@3.5.11_typescript@5.6.3_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { resolve } from "node:path";
import { nodeExternals } from "file:///Users/alexgaillard/Desktop/dev/monospace/directus/node_modules/.pnpm/rollup-plugin-node-externals@7.1.3_rollup@4.21.2/node_modules/rollup-plugin-node-externals/dist/index.js";
import { defineConfig } from "file:///Users/alexgaillard/Desktop/dev/monospace/directus/node_modules/.pnpm/vite@5.2.11_@types+node@22.7.5_sass@1.79.4_terser@5.31.6/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/alexgaillard/Desktop/dev/monospace/directus/node_modules/.pnpm/vite-plugin-dts@4.2.3_@types+node@22.7.5_rollup@4.21.2_typescript@5.6.3_vite@5.2.11_@types+no_rujvm6s4dgme4472zgwpomg4aa/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/alexgaillard/Desktop/dev/monospace/directus/packages/components";
var vite_config_default = defineConfig({
  plugins: [{ ...nodeExternals(), enforce: "pre" }, vue(), dts()],
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es"]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYWxleGdhaWxsYXJkL0Rlc2t0b3AvZGV2L21vbm9zcGFjZS9kaXJlY3R1cy9wYWNrYWdlcy9jb21wb25lbnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvYWxleGdhaWxsYXJkL0Rlc2t0b3AvZGV2L21vbm9zcGFjZS9kaXJlY3R1cy9wYWNrYWdlcy9jb21wb25lbnRzL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9hbGV4Z2FpbGxhcmQvRGVza3RvcC9kZXYvbW9ub3NwYWNlL2RpcmVjdHVzL3BhY2thZ2VzL2NvbXBvbmVudHMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IG5vZGVFeHRlcm5hbHMgfSBmcm9tICdyb2xsdXAtcGx1Z2luLW5vZGUtZXh0ZXJuYWxzJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuXHRwbHVnaW5zOiBbeyAuLi5ub2RlRXh0ZXJuYWxzKCksIGVuZm9yY2U6ICdwcmUnIH0sIHZ1ZSgpLCBkdHMoKV0sXG5cdGJ1aWxkOiB7XG5cdFx0bGliOiB7XG5cdFx0XHRlbnRyeTogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvaW5kZXgudHMnKSxcblx0XHRcdGZpbGVOYW1lOiAnaW5kZXgnLFxuXHRcdFx0Zm9ybWF0czogWydlcyddLFxuXHRcdH0sXG5cdH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb1ksT0FBTyxTQUFTO0FBQ3BaLFNBQVMsZUFBZTtBQUN4QixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFNBQVM7QUFKaEIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDM0IsU0FBUyxDQUFDLEVBQUUsR0FBRyxjQUFjLEdBQUcsU0FBUyxNQUFNLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztBQUFBLEVBQzlELE9BQU87QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNKLE9BQU8sUUFBUSxrQ0FBVyxjQUFjO0FBQUEsTUFDeEMsVUFBVTtBQUFBLE1BQ1YsU0FBUyxDQUFDLElBQUk7QUFBQSxJQUNmO0FBQUEsRUFDRDtBQUNELENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
