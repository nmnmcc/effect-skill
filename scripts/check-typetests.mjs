import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import MarkdownIt from "markdown-it"

// Fences tagged `ts tst` are TSTyche type tests: they are extracted to
// .cache/typetests/*.tst.ts and run with `tstyche`, so the docs cannot drift.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const output = path.join(root, ".cache", "typetests")
const markdown = new MarkdownIt()
const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
  ))
  return nested.flat().filter((file) => file.endsWith(".md")).sort()
}

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
let count = 0
for (const file of await walk(path.join(root, "skills"))) {
  const label = path.relative(path.join(root, "skills"), file).replace(/[\\/]/g, "_").slice(0, -3)
  const fences = markdown.parse(await readFile(file, "utf8"), {}).filter((token) =>
    token.type === "fence" && /^ts\s+tst(\s|$)/.test(token.info)
  )
  for (const [index, fence] of fences.entries()) {
    await writeFile(path.join(output, `${label}-${index + 1}.tst.ts`), fence.content)
    count++
  }
}
if (count === 0) throw new Error("no `ts tst` fences found")

await writeFile(path.join(output, "tsconfig.json"), JSON.stringify({ extends: "../../tsconfig.json", include: ["./*.ts"] }))
const run = spawnSync(path.join(root, "node_modules", ".bin", "tstyche"), [
  "--config", path.join(root, "tstyche.json")
], { cwd: root, stdio: "inherit" })
process.exit(run.status ?? 1)
