// The one Anthropic call shared by the api/ endpoints that return structured
// output through a tool.
//
// Primary model: Claude Opus 5.5 at low effort. Measured in November 2026
// against an audience that has already done the basics with AI, it produced
// roughly one fresh idea or designed change move in three, where Sonnet 4.6
// produced about one in twenty on the same prompts, at similar latency.
// Opus 5.5 rejects a forced tool_choice, so the tool is offered with
// tool_choice "auto" and every prompt ends by asking for the tool call.
//
// Fallback: the previous production path (Sonnet 4.6 with a forced tool
// call). It runs whenever the primary call errors, times out, is declined,
// is rate limited, or comes back without the tool call, so a workshop room
// never sees a failure the old setup would not also have produced.
const API_URL = "https://api.anthropic.com/v1/messages";
export const PRIMARY_MODEL = "claude-opus-5-5";
export const FALLBACK_MODEL = "claude-sonnet-4-6";

// Vercel caps each function at 90s. A slow primary call must leave the
// fallback (about 20s) room to finish inside that.
const PRIMARY_TIMEOUT_MS = 45_000;
// Opus 5.5 always thinks; max_tokens covers thinking plus the tool call.
const PRIMARY_MAX_TOKENS = 8000;

async function post(body, timeoutMs) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
  });
  if (!response.ok) {
    return { ok: false, status: response.status, text: await response.text() };
  }
  return { ok: true, data: await response.json() };
}

const findToolInput = (data, tool) =>
  data.content?.find((b) => b.type === "tool_use" && b.name === tool.name)
    ?.input;

// Returns { ok: true, input, model } or { ok: false, status, error } where
// status/error are what the endpoint should send to the client.
export async function callTool({
  label,
  tool,
  messages,
  system,
  fallbackMaxTokens,
  primary = true,
}) {
  const shared = { ...(system ? { system } : {}), tools: [tool], messages };

  if (primary) {
    let reason;
    try {
      const r = await post(
        {
          model: PRIMARY_MODEL,
          max_tokens: PRIMARY_MAX_TOKENS,
          output_config: { effort: "low" },
          tool_choice: { type: "auto" },
          ...shared,
        },
        PRIMARY_TIMEOUT_MS,
      );
      if (r.ok) {
        const input = findToolInput(r.data, tool);
        if (input) return { ok: true, input, model: PRIMARY_MODEL };
        reason = `no tool call, stop_reason ${r.data.stop_reason}`;
      } else {
        reason = `HTTP ${r.status} ${r.text.slice(0, 300)}`;
      }
    } catch (err) {
      reason = err?.name === "TimeoutError" ? "timeout" : String(err);
    }
    console.warn(
      `[${label}] ${PRIMARY_MODEL} failed (${reason}); falling back to ${FALLBACK_MODEL}`,
    );
  }

  const r = await post({
    model: FALLBACK_MODEL,
    max_tokens: fallbackMaxTokens,
    tool_choice: { type: "tool", name: tool.name },
    ...shared,
  });
  if (!r.ok) {
    console.error("Claude API error:", r.status, r.text);
    return {
      ok: false,
      status: 502,
      error: `Claude API returned ${r.status}`,
    };
  }
  const input = findToolInput(r.data, tool);
  if (!input) {
    console.error(
      "Expected tool_use block missing. stop_reason:",
      r.data.stop_reason,
      "| content types:",
      r.data.content?.map((b) => b.type).join(",") || "none",
      "| raw response:",
      JSON.stringify(r.data).slice(0, 1000),
    );
    return { ok: false, status: 500, error: "Model did not return a result" };
  }
  return { ok: true, input, model: FALLBACK_MODEL };
}
