import type { IncomingMessage, ServerResponse } from "http";
import { routes, type ApiResponse } from "../apiRoutes.js";

// ----------------------------------------------------
// Vercel Serverless Function (Node.js runtime).
// Catches every request under /api/* and dispatches it through the
// framework-neutral route table in apiRoutes.ts (same table used by
// server.ts for local development).
// ----------------------------------------------------

// Default Node function timeout (10s) is too short for /api/news/expand and
// /api/news/summarize, which chain an article full-text fetch with up to 4
// sequential Gemini model attempts (see callGeminiWithFallback in apiRoutes.ts).
export const config = {
  maxDuration: 30,
};

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  // Vercel's Node.js runtime already parses JSON bodies onto req.body.
  const preParsed = (req as IncomingMessage & { body?: unknown }).body;
  if (preParsed !== undefined) return preParsed;

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    return {};
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const method = (req.method || "GET").toUpperCase();
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  const sendJson = (status: number, data: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(data ?? null));
  };

  const route = routes.find((r) => r.method === method && r.path === pathname);
  if (!route) {
    sendJson(404, { error: "Not found" });
    return;
  }

  const body = method === "POST" ? await readJsonBody(req) : {};

  let status = 200;
  let payload: unknown = null;
  const apiRes: ApiResponse = {
    status(code) {
      status = code;
      return apiRes;
    },
    json(data) {
      payload = data;
      return apiRes;
    }
  };

  try {
    await route.handler({ query: Object.fromEntries(url.searchParams), body }, apiRes);
  } catch (err) {
    console.error(`API error on ${method} ${pathname}:`, err);
    sendJson(500, { error: "Internal server error" });
    return;
  }

  sendJson(status, payload);
}
