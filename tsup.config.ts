import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/lib.ts"],
  format: ["cjs", "esm"],
  clean: true,
  dts: true,
});
