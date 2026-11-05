# Effect Skill

A single [Agent Skill](https://agentskills.io/specification) that teaches a
developer or coding agent **how to think in Effect and how to write correct
Effect code**: reading `Effect<A, E, R>`, designing typed errors, services and
layers, translating `async/await` habits, and verifying the result against the
installed library. This is a community repository, not an official Effect
release.

## What is inside

```
skills/effect/
  SKILL.md                   mindset, six design rules, type-first method, six pre-coding questions,
                             complete program skeleton, habit translation table,
                             anti-patterns, review checklist, router to guides
  references/
    type-first.md            design types before bodies: loop, techniques, compiler-as-reviewer
    reading-the-source.md    find, read and test claims against node_modules/effect (JSDoc, ai-docs, internal)
    mental-model.md          how to read and design by type; fibers; scopes
    from-async-await.md      before/after rewrites of common imperative code
    worked-example.md        a feature designed decision by decision
    v4-names.md              v3 → v4 renames that trip people (and models) up
    composition.md           which modules combine for which job
    <topic>/guide.md         24 module guides: core, services, schema, data,
                             config, concurrency, state, time, streams,
                             encoding, platform, http, http-api, rpc, sql,
                             persistence, workflow, cluster, eventlog,
                             observability, cli, ai, testing, reactivity
    <topic>/*.md             verified API cheat sheets and longer recipes
```

Every module guide has the same shape: how to think about the module → a
decision table → a complete recipe → anti-patterns (wrong → right) → how to
test it → boundaries with neighbouring modules. Every API in it was checked
against the installed `effect@4.1.2` source.

## Version

The code targets **`effect@4.1.2`** (latest 4.1.x) at upstream commit
`506eef143bcc1750ce58920aac1e45da7265d103`, with `@effect/*` integrations pinned
to the same version. Effect v4 is npm `latest`; do not apply these imports to a
v3 project without a migration. See the [version and source policy](docs/version-policy.md).

## Install

```sh
npx skills add nmnmcc/effect-skills --skill effect --agent codex -y
```

From a checkout, substitute `.` for `nmnmcc/effect-skills`. Installing the
skill does **not** install Effect into your application; pin `effect` and any
`@effect/*` packages yourself. Once Effect is installed, the skill points
agents at the library's own `node_modules/effect/ai-docs` and source as the
final authority.

## Examples and verification

A [complete user API example](examples/user-api.ts) connects Schema, HttpApi,
Context/Layer, a Node HTTP server, and file-backed PGlite; its
[integration test](examples/user-api.test.ts) issues real HTTP requests and
restarts the database.

```sh
devenv shell -- npm ci
devenv shell -- npm test
devenv shell -- python3 scripts/validate-skills.py --external
```

`npm test` validates packaging and local links, typechecks every `ts` fence in
`SKILL.md` and all references against the pinned release (fences tagged
`ts skip` are deliberate anti-patterns and are not compiled), **runs the
self-contained fences with Effect's own `@effect/doctest`** (fences tagged
`ts import.meta.vitest`, `// =>` comments are assertions), runs the
TSTyche type tests (fences tagged `ts tst`), runs the
HTTP/database test, and installs the skill into a disposable project.
`--external` fetches the linked official sources and needs network access. See
[CONTRIBUTING.md](CONTRIBUTING.md).

Licensed under [MIT](LICENSE).
