# Contributing

Use the `effect@4.1.2` package and its pinned
[source policy](docs/version-policy.md) when changing an example. Compare
both the installed export map and declarations before naming a symbol;
`main` may contain unreleased import paths. Keep any added `@effect/*`
integrations on the same exact `4.1.2` version in `package.json` and the
lockfile.

## Skill design

There is one skill, `skills/effect`. Teaching beats cataloguing: a reader
should leave able to *write* correct Effect, not just name modules.

- `SKILL.md` carries the mindset, rules, the program skeleton and the router.
  Keep it short and judgment-dense; push depth to `references/`.
- Each module guide (`references/<topic>/guide.md`) has: how to think about
  it, a decision table, a complete recipe, anti-patterns as wrong → right
  pairs, a testing section, boundaries, and pinned source links. Long
  signature tables go in sibling cheat-sheet files.
- Verify every identifier against `node_modules/effect/src`, the `.d.ts`
  files, or `node_modules/effect/ai-docs`; never write from v3 memory.
- Every `ts`/`tsx` fence is compiled independently, so make it a complete
  file. Tag intentionally wrong code or uninstalled packages `ts skip`.
  Call a snippet "typechecked" unless a runtime test exercises it, and add a
  scoped integration test for cross-module behaviour.
- Reuse Effect's own doctest: tag a self-contained fence
  `ts import.meta.vitest name="..."` and it runs under Vitest via
  `@effect/doctest` (`npm run test:doctest`, config in `vitest.docs.ts`).
  Put a trailing `// => expected` on an expression to assert it with Effect's
  `Equal`; `await` any Effect you run (`await Effect.runPromise(...)`).
  Fences that only `declare` their inputs stay plain `ts` (typechecked, not run).
- Type tests: tag a fence `ts tst` and it is extracted to `*.tst.ts` and run
  by TSTyche (`npm run test:types`). Pin `A`/`E`/`R` and brands, not values.
- Links stay inside `skills/effect` so the skill is installable alone.

## Checks

```sh
devenv shell -- npm ci
devenv shell -- npm test
devenv shell -- python3 scripts/validate-skills.py --external
```

`npm test` runs packaging and local-link validation, compiles every skill
example, and exercises the real HTTP/SQL example. The external check follows
official documentation and pinned-source links and needs network access.
Run the [Agent Skills reference validator](https://agentskills.io/specification.md)
against each skill when available. The pinned `skills` CLI is exercised in
disposable projects by the repository test:

```sh
devenv shell -- npm run check:install
```

The check covers discovery, single- and multiple-skill installation, and
installed local references without touching the developer's agent setup.
