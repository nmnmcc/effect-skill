# Type-level tests

Type-first means the types *are* the specification. A specification needs
tests: something that fails when a refactor quietly widens an error, drops a
requirement, or turns a branded id back into `string`. Runtime tests cannot do
that, because none of those regressions changes a value. Type tests can.

This is how Effect tests itself: its repository keeps `*.tst.ts` files under
`packages/*/typetest/` and runs them with [TSTyche](https://tstyche.org). See
[`Brand.tst.ts`](https://github.com/Effect-TS/effect/blob/effect%404.1.2/packages/effect/typetest/Brand.tst.ts)
and
[`Effect.tst.ts`](https://github.com/Effect-TS/effect/blob/effect%404.1.2/packages/effect/typetest/Effect.tst.ts)
for the house style.

## What to pin down

Write a type test for a fact the *design* promises and that no value-level test
sees:

| Fact | Assertion |
| --- | --- |
| A use case's contract (`A`, `E`, `R`) | `expect(fn).type.toBe<(...) => Effect.Effect<A, E, R>>()` |
| A layer builds `X` and still needs `Y` | `Layer.Success` / `Layer.Services` of the layer |
| Wiring is complete | `Effect.Services<typeof program>` is `never` |
| Errors were fully handled | `Effect.Error<typeof handled>` is `never` |
| A brand blocks raw primitives | `expect(fn).type.not.toBeCallableWith("raw")` |
| Domain type versus wire type | `typeof S.Type` and `typeof S.Encoded` with `toBe` |
| A union is closed and discriminated | `expect<X["_tag"]>().type.toBe<"A" \| "B">()` |
| A variant lacks a field | `.type.not.toHaveProperty("receipt")` |

Do not type-test every function. Test the seams other code depends on: public
use cases, service contracts, schemas, layers. Private helpers whose types are
inferred need nothing.

## Example: the orders contract

The contract from the [type-first](type-first.md) walkthrough, pinned. Each test
fails if the declared failures, the requirement or the brand changes.

```ts tst
import { Context, Effect, Layer, Schema } from "effect"
import { describe, expect, it } from "tstyche"

// ---- the design under test: types first, bodies second --------------------
const OrderId = Schema.String.pipe(Schema.brand("OrderId"))
type OrderId = typeof OrderId.Type

const Draft = Schema.TaggedStruct("Draft", { id: OrderId, total: Schema.Number })
const Paid = Schema.TaggedStruct("Paid", { id: OrderId, total: Schema.Number, receipt: Schema.String })
const Order = Schema.Union([Draft, Paid])
type Order = typeof Order.Type

class OrderNotFound extends Schema.TaggedError<OrderNotFound>()("OrderNotFound", { id: OrderId }) {}
class AlreadyPaid extends Schema.TaggedError<AlreadyPaid>()("AlreadyPaid", { id: OrderId }) {}

class Orders extends Context.Service<Orders, {
  readonly get: (id: OrderId) => Effect.Effect<Order, OrderNotFound>
}>()("app/Orders") {
  static readonly layerMemory = Layer.succeed(Orders, {
    get: (id) => Effect.fail(new OrderNotFound({ id }))
  })
}

const payOrder = Effect.fn("payOrder")(function*(id: OrderId) {
  const order = yield* (yield* Orders).get(id)
  if (order._tag === "Paid") return yield* new AlreadyPaid({ id })
  return { ...order, _tag: "Paid" as const, receipt: `r-${order.id}` }
})

// ---- the type tests ---------------------------------------------------------
describe("payOrder", () => {
  it("states its contract in A, E and R", () => {
    expect(payOrder).type.toBe<(id: OrderId) => Effect.Effect<
      { _tag: "Paid"; receipt: string; id: OrderId; total: number },
      OrderNotFound | AlreadyPaid,
      Orders
    >>()
  })

  it("is fully wired once Orders is provided", () => {
    const wired = payOrder(OrderId.make("o1")).pipe(Effect.provide(Orders.layerMemory))
    expect<Effect.Services<typeof wired>>().type.toBe<never>()
  })

  it("rejects a raw string where an OrderId is expected", () => {
    expect(payOrder).type.not.toBeCallableWith("o1")
    expect(payOrder).type.toBeCallableWith(OrderId.make("o1"))
  })

  it("lets exhaustive handling narrow E", () => {
    const handled = payOrder(OrderId.make("o1")).pipe(
      Effect.catchTags({ OrderNotFound: () => Effect.succeed(undefined), AlreadyPaid: () => Effect.succeed(undefined) })
    )
    expect<Effect.Error<typeof handled>>().type.toBe<never>()
  })
})

describe("Order", () => {
  it("is a closed union discriminated by _tag", () => {
    expect<Order["_tag"]>().type.toBe<"Draft" | "Paid">()
    expect<Extract<Order, { _tag: "Draft" }>>().type.not.toHaveProperty("receipt")
  })
})
```

Run it and, to see it work, break the design on purpose: widen
`Orders.get` to take `string`, or drop `AlreadyPaid` from the handler map. The
matching test fails with the exact type that changed.

## Example: schemas and layers

```ts tst
import { Context, Effect, Layer, Schema } from "effect"
import { describe, expect, it } from "tstyche"

const Money = Schema.Struct({
  amount: Schema.NumberFromString,
  currency: Schema.Literals(["EUR", "USD"])
})

describe("Money", () => {
  it("separates the domain type from the wire type", () => {
    expect<typeof Money.Type>().type.toBe<{ readonly amount: number; readonly currency: "EUR" | "USD" }>()
    expect<typeof Money.Encoded>().type.toBe<{ readonly amount: string; readonly currency: "EUR" | "USD" }>()
  })

  it("decodes unknown input into a typed failure channel", () => {
    const decode = Schema.decodeUnknownEffect(Money)
    expect<Effect.Error<ReturnType<typeof decode>>>().type.toBe<Schema.SchemaError>()
    expect<Effect.Success<ReturnType<typeof decode>>>().type.toBe<typeof Money.Type>()
  })
})

class Clock2 extends Context.Service<Clock2, { readonly now: Effect.Effect<number> }>()("app/Clock2") {}
class Audit extends Context.Service<Audit, { readonly record: (event: string) => Effect.Effect<void> }>()("app/Audit") {
  static readonly layer = Layer.effect(Audit, Effect.gen(function*() {
    const clock = yield* Clock2
    return { record: (event) => Effect.map(clock.now, (t) => console.log(t, event)) }
  }))
}

describe("Audit.layer", () => {
  it("exposes what it builds and what it still needs", () => {
    expect<Layer.Success<typeof Audit.layer>>().type.toBe<Audit>()
    expect<Layer.Services<typeof Audit.layer>>().type.toBe<Clock2>()
  })

  it("is fully wired after providing Clock2", () => {
    const clock = Layer.succeed(Clock2, { now: Effect.succeed(0) })
    const wired = Audit.layer.pipe(Layer.provide(clock))
    expect<Layer.Services<typeof wired>>().type.toBe<never>()
  })
})
```

## Reading the assertions

- `expect(value)` takes a *value* and inspects its type; `expect<T>()` takes a
  *type*. Use the second for `Effect.Success`, `Effect.Error`,
  `Effect.Services`, `Layer.Success` and `Schema.Type` projections.
- `.type.toBe<T>()` demands the **identical** type. `.type.toBeAssignableTo<T>()`
  is the looser check; use it when you only promise "at least this".
- `.type.not.toBeCallableWith(...)` is the replacement for a pile of
  `// @ts-expect-error` lines, and it says in its name what it checks.
- Effects keep requirements in `R`. Because `toBe` is exact, a test on a
  program with `Effect.Services<typeof program>` equal to `never` is also a
  test that nobody added a service nobody provides.

## `@ts-expect-error` versus TSTyche

| | `// @ts-expect-error` | TSTyche |
| --- | --- | --- |
| Lives in | production or example code | `*.tst.ts`, never shipped |
| Proves | this line does not compile | exact type, callability, assignability, property presence |
| Failure message | "unused directive" | the expected and the actual type |
| Good for | one-off illustration in docs | a lasting regression suite |

Keep `@ts-expect-error` for documentation (it is what this skill's examples
use). Use TSTyche for tests you rely on.

## Set it up in a project

```bash
npm install --save-dev tstyche
```

```json
{
  "$schema": "./node_modules/tstyche/schemas/config.json",
  "testFileMatch": ["typetest/**/*.tst.ts"]
}
```

```bash
npx tstyche
```

- Name files `*.tst.ts` and keep them out of the runtime build and out of
  Vitest's `include`. TSTyche never executes them; it only asks the compiler.
- Pin the TypeScript version it uses (`tstyche --target '>=5.9'` is what Effect
  runs, and TSTyche can test against several versions). Type behaviour changes
  between compiler releases, so a library should test its range.
- Run it in CI next to `tsc --noEmit` and the runtime tests. The three answer
  different questions: does it compile, does it behave, did the design change.

## Where it fits in the loop

1. Write the types and the service contracts ([type-first](type-first.md)).
2. Write the type test for the use-case signature **before the body**. It fails
   to compile or fails to match: that is the red step.
3. Implement until `tstyche` and `tsc` pass.
4. Write the runtime tests ([testing](testing/guide.md)) for behaviour.

A type test is cheap when written at step 2 and expensive to reconstruct later.

## Known limits

- It checks types only. `toBe<never>()` on `R` proves nothing about whether the
  service *works*.
- Inferred types can be long. Assert the projection you care about
  (`Effect.Error<...>`) rather than the whole `Effect<...>` when the full type
  is incidental.
- Results can differ across TypeScript versions. Treat a failure after a
  compiler upgrade as information, not noise.
