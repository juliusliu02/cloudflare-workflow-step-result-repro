import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";

type ProbeKind = "number" | "primitive" | "string";

interface ProbeParams {
  kind: ProbeKind;
}

export class StepResultProbeWorkflow extends WorkflowEntrypoint<Env, ProbeParams> {
  override async run(
    event: Readonly<WorkflowEvent<ProbeParams>>,
    step: WorkflowStep,
  ): Promise<void> {
    if (event.payload.kind === "string") {
      await step.do("probe", async () => ({ id: "1" }));
      return;
    }
    if (event.payload.kind === "number") {
      await step.do("probe", async () => ({ id: 1 }));
      return;
    }
    await step.do("probe", async () => "1");
  }
}

const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const kind = url.pathname.slice("/probe/".length);
    if (
      request.method === "POST" &&
      (kind === "string" || kind === "number" || kind === "primitive")
    ) {
      const id = crypto.randomUUID();
      await env.STEP_RESULT_PROBE.create({ id, params: { kind } });
      return json({ id, kind, status: `/status/${id}` }, 202);
    }
    if (request.method === "GET" && url.pathname.startsWith("/status/")) {
      const id = url.pathname.slice("/status/".length);
      if (id.length === 0) return json({ error: "Missing Workflow instance id" }, 400);
      const instance = await env.STEP_RESULT_PROBE.get(id);
      return json(await instance.status());
    }
    if (request.method === "GET" && url.pathname === "/") {
      return json({
        reproduction: "Cloudflare Workflow object step-result jsrpc error",
        probes: {
          objectString: "POST /probe/string returns { id: \"1\" } from step.do",
          objectNumber: "POST /probe/number returns { id: 1 } from step.do",
          primitiveControl: "POST /probe/primitive returns \"1\" from step.do",
          status: "GET /status/:instanceId",
        },
      });
    }

    return json({ error: "Not found" }, 404);
  },
};
