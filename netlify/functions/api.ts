import { routes, type ApiResponse } from "../../apiRoutes";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data ?? null), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  const route = routes.find((r) => r.method === req.method && r.path === pathname);
  if (!route) return json({ error: "Not found" }, 404);

  let body: unknown = {};
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  let status = 200;
  let payload: unknown = null;
  const res: ApiResponse = {
    status(code) {
      status = code;
      return res;
    },
    json(data) {
      payload = data;
      return res;
    }
  };

  try {
    await route.handler({ query: Object.fromEntries(url.searchParams), body }, res);
  } catch (err) {
    console.error(`API error on ${req.method} ${pathname}:`, err);
    return json({ error: "Internal server error" }, 500);
  }

  return json(payload, status);
};

export const config = { path: "/api/*" };
