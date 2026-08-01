# Cloudflare Workflow step-result reproduction

Minimal reproduction for a Cloudflare Workflows `step.do()` result issue.

Object-valued results produce a terminal `jsrpc` hang error:

```ts
await step.do("probe", async () => ({ id: "1" }));
await step.do("probe", async () => ({ id: 1 }));
```

A top-level primitive result works:

```ts
await step.do("probe", async () => "1");
```

All Workflow instances are still recorded as successfully completed. Cloudflare documents these values as valid structured-cloneable step results in the [Workflows Workers API](https://developers.cloudflare.com/workflows/build/workers-api/#returning-state).

## Local use

```sh
pnpm install
pnpm run cf-typegen
pnpm run typecheck
pnpm run dev
```
