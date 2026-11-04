# What changed from 4.0.0 to 4.1.x

Sources: the [4.1.0](https://github.com/Effect-TS/effect/releases/tag/effect%404.1.0),
[4.1.1](https://github.com/Effect-TS/effect/releases/tag/effect%404.1.1) and
[4.1.2](https://github.com/Effect-TS/effect/releases/tag/effect%404.1.2) release
notes, verified against the installed `effect@4.1.2` sources. The module guides
under `skills/effect/references/` are written for 4.1.2 and carry a "Changed in
4.1" section where it matters.

## Breaking or migration-relevant

- **Crypto**: `effect/Crypto` is replaced by family-specific `effect/crypto/*`
  modules (`Aead`, `Cipher`, `Digest`, `Kdf`, `KeyAgreement`, `Mac`,
  `SecureRandom`, `Signature`, `WebCrypto`, …). Provide crypto explicitly
  (`NodeCrypto.layer` etc.); it is no longer part of the runtime `*Services`
  bundles. `SqlMessageStorage`, `SingleRunner` and the event-log encryption now
  take `Digest`/`Aead`/`Signature`/`SecureRandom` from context.
- **CLI**: `Terminal` gains a required `size` (custom terminals passed to
  `Terminal.make` must supply it); inherited flags render in their own help
  section and custom formatters must read `HelpDoc.inheritedFlags`.
- **SQL**: `sql.insert`/`updateValues` require a non-empty array at the type
  level; `Migrator.fromFileSystem` moved to `effect/sql/MigratorFileSystem`.
- **HTTP**: request methods are typed `string`; `HttpClient.withCookiesRef`
  takes a `Ref<ReadonlyArray<Cookie>>` and matches host/path/scheme.
- **AI**: `AiError.HttpRequestDetails` removed (no request headers/query in
  errors); `NetworkError` carries an optional `cause`.
- **Toml.parse** returns a `Result`; `Base64Url.decode` rejects partial padding;
  `McpServer` registration layers move to the transport `registrations` option.

## New capabilities worth knowing

- `McpServer` / `McpClient` / `McpTest` in `effect/ai`; `Decision` images.
- `effect/encoding`: `Csv`, `Json5`, `Jsonc`, `Tar`, `Xml`, `Zip`, `Yaml` fixes.
- `Glob` and `FileSystem.glob`; `Bytes`; `CommandLine` for `effect/process`.
- `Duration.formatIso/fromIso/toMicros`, `Schema.DurationFromIsoString`,
  `Schema.isAscii`, cron `onDstOverlap`.
- `HttpApi` opt-in RFC 9457 problem details; `HttpClient.isTransientError`.
- `KeyValueStore.keys`, isolated `Persistence` stores, `Pool.stats`.
- `Effect.ignore({ log: "Unhandled" })`, `Effect.fnUntraced({ self }, …)`.
- Cluster: `ShardingConfig.runnerJoinDebounce` plus many fixes in 4.1.1/4.1.2
  (entity defect backoff, workflow engine shard handling).
