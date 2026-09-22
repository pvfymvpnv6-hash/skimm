import type { IncomingMessage, ServerResponse } from "http";
import { routes, type ApiResponse } from "../apiRoutes.js";

// ----------------------------------------------------
// Vercel Serverless Function (Node.js runtime).
// Handles every request under /api/* and dispatches it through the
// framework-neutral route table in apiRoutes.ts (same table used by
// server.ts for local development).
//
// This is a plain, non-dynamic function (no [...slug] catch-all file).
// vercel.json rewrites /api/:path* to /api?slug=:path*, so Vercel never
// has to pattern-match a dynamic route file for nested paths - it only
// ever resolves the single, always-matching /api route. The original
// path is reconstructed here from the injected `slug` query param.
// (A dynamic api/[...slug].ts catch-all file previously failed to match
// any 2+ segment path like /api/news/expand on Vercel - GET /api/stocks
// worked, POST /api/news/expand 404'd at the platform routing layer,
// confirmed via Vercel function logs showing zero invocations.)
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

  // The vercel.json rewrite injects the real path (everything after /api/)
  // as a `slug` query param, e.g. /api/news/expand -> slug=news/expand.
  const slug = url.searchParams.get("slug") || "";
  url.searchParams.delete("slug");
  const pathname = ("/api/" + slug).replace(/\/+$/, "") || "/api";

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
