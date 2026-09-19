import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { routes } from "./apiRoutes";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

for (const route of routes) {
  if (route.method === "GET") app.get(route.path, route.handler);
  else app.post(route.path, route.handler);
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server läuft auf http://0.0.0.0:${PORT}`);
  });
}

startServer();
