import * as Doctest from "@effect/doctest/Plugin"
import { defineConfig } from "vitest/config"

// Runs every Markdown fence tagged `ts import.meta.vitest` as an isolated test.
export default defineConfig({
  plugins: [Doctest.plugin()],
  test: {
    passWithNoTests: true,
    testTimeout: 20_000,
    include: [],
    includeSource: ["skills/**/*.md"]
  }
})
