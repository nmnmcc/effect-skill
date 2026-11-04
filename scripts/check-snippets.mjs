import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import MarkdownIt from "markdown-it"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const only = process.argv.slice(2)
const output = path.join(root, ".cache", only.length ? `snippets-${only.join("+")}` : "snippets")
const markdown = new MarkdownIt()
const folders = (await readdir(path.join(root, "skills"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && (only.length === 0 || only.includes(entry.name)))
  .map((entry) => entry.name)
  .sort()
const files = []

// A fence tagged `ts skip` is intentionally uncompiled (e.g. a labelled anti-pattern).
const checked = (token) => /^(ts|tsx)(\s|$)/.test(token.info) && !/\bskip\b/.test(token.info)
const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const nested = await Promise.all(entries.map((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
  ))
  return nested.flat().filter((file) => file.endsWith(".md")).sort()
}
const markdownFiles = async (folder) => {
  const base = path.join(root, "skills", folder)
  return (await walk(base)).map((file) => [path.relative(base, file).replace(/[\\/]/g, "_").slice(0, -3), file])
}

await mkdir(output, { recursive: true })
for (const folder of folders) {
  let count = 0
  for (const [label, file] of await markdownFiles(folder)) {
    const source = await readFile(file, "utf8")
    const snippets = markdown.parse(source, {}).filter((token) => token.type === "fence" && checked(token))
    for (const [index, snippet] of snippets.entries()) {
      const out = path.join(output, `${folder}-${label}-${index + 1}.${snippet.info.startsWith("tsx") ? "tsx" : "ts"}`)
      await writeFile(out, snippet.content)
      files.push(out)
      count++
    }
  }
  if (count === 0) {
    throw new Error(`${folder} must contain a TypeScript example`)
  }
}

const config = path.join(output, "tsconfig.json")
await writeFile(config, JSON.stringify({
  extends: "../../tsconfig.json",
  files: [
    ...files.map((file) => path.basename(file)),
    ...(only.length ? [] : ["../../examples/user-api.ts", "../../examples/user-api.test.ts"])
  ],
  include: []
}))
const check = spawnSync(path.join(root, "node_modules", ".bin", "tsc"), ["--project", config], {
  cwd: root,
  stdio: "inherit"
})
if (check.error) throw check.error
if (check.status !== 0) {
  process.exitCode = check.status || 1
} else {
  console.log(`Typechecked ${files.length} snippets across ${folders.length} skills and the end-to-end example`)
}
