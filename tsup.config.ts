import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  sourcemap: true,
  treeshake: true,
  clean: true,
  entry: ["src/lib.ts"],
  format: ["cjs", "esm"],
});
