# Effect v4 version policy

All executable examples in this repository target exactly `effect@4.1.2`, the
latest 4.1.x patch at the time of writing (npm `latest`). The
[official release](https://github.com/Effect-TS/effect/releases/tag/effect%404.1.2)
is tagged at commit
[`506eef143bcc1750ce58920aac1e45da7265d103`](https://github.com/Effect-TS/effect/commit/506eef143bcc1750ce58920aac1e45da7265d103);
the [tag reference](https://api.github.com/repos/Effect-TS/effect/git/ref/tags/effect%404.1.2)
records that commit. Keep the exact pin so snippets and integration
dependencies cannot drift independently. The [4.1 changes note](effect-4.1-changes.md)
lists what moved since 4.0.0, and the [4.0.0 migration research](effect-4.0.0-migration.md)
records the v3 → v4 renames the guides rely on.

Use the [published 4.1.2 export map](https://registry.npmjs.org/effect/4.1.2)
as the import authority, and the [tagged package source](https://github.com/Effect-TS/effect/blob/effect%404.1.2/packages/effect/package.json)
with the installed type declarations to check named APIs. Stable modules use
published `effect/*` exports (`effect/Effect`, `effect/Schema`,
`effect/Context`). Formerly separate packages are top-level subpaths of
`effect`: `http`, `http-api`, `sql`, `ai`, `cli`, `rpc`, `cluster`, `workflow`,
`eventlog`, `persistence`, `crypto`, `encoding`, and others. Many of these
remain marked `@stability unstable` and may change incompatibly in a minor
release, so recheck exports and types before upgrading. The old
`effect/unstable/*` paths do not exist, and `httpapi` is `http-api`.

Pin separately installed `@effect/*` integration packages (`platform-node`,
SQL drivers, AI providers, `vitest`, `doctest`) to the **same exact version**.
A compatible peer range (`effect@^4.1.2`) is not a reason to leave examples
floating across releases. `@effect/vitest` and `@effect/doctest` need
Vitest 5 and, for the doctest plugin, Vite 8.

Effect v3 packages and imports are not compatible. v4 consolidates former
`@effect/platform`, `@effect/rpc` and other modules into `effect` and changes
service and API names; consult the tagged
[migration guide](https://github.com/Effect-TS/effect/blob/effect%404.1.2/MIGRATION.md)
and [import map](https://github.com/Effect-TS/effect/blob/effect%404.1.2/migration/v3-to-v4.md)
when porting v3 code. No v3 fallback is promised here.

Do not substitute the repository's moving `main` branch for the published
release: `main` may contain unreleased changes. Use the tagged source and the
published export map when checking imports.
