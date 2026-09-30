import express from "express";
import { z } from "zod";
import { reply } from "./bot.js";
import { activeDefects } from "./defects.js";
import { createProvider } from "./providers/index.js";

export const MAX_MESSAGE_CHARS = 2000;

const defects = activeDefects();
const provider = createProvider();
const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(express.static(new URL("../public", import.meta.url).pathname));

const maxChars = defects.has("no-length-guard") ? Infinity : MAX_MESSAGE_CHARS;
const ChatRequest = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(maxChars) }))
    .min(1)
    .refine((m) => m.at(-1)?.role === "user", "last message must be from the user"),
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", provider: provider.name, defects: [...defects] });
});

app.get("/api/config", (_req, res) => {
  res.json({ uiSwallowsErrors: defects.has("ui-swallows-errors") });
});

app.post("/api/chat", async (req, res) => {
  const parsed = ChatRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues.map((i) => i.message) });
    return;
  }
  try {
    const out = await reply(provider, parsed.data.messages, defects);
    res.json({ reply: out.text, model: out.model, stopReason: out.stopReason });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "upstream_error" });
  }
});

// Keep the error contract JSON even when the body never reaches the route
// (malformed JSON, oversized payload); Express's default handler would answer with an HTML page.
app.use((err: { status?: number; type?: string }, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.type === "entity.parse.failed") return void res.status(400).json({ error: "invalid_json" });
  if (err.type === "entity.too.large") return void res.status(413).json({ error: "payload_too_large" });
  next(err);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Northwind support bot on http://localhost:${port} (provider=${provider.name}, defects=[${[...defects]}])`);
});
