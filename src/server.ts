import * as dotenv from "dotenv";
import Koa, { Context } from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import serve from "koa-static";
import { getHealth } from "./controllers/healthController";
import { searchTracks } from "./controllers/searchController";
import { getTrackDetails } from "./controllers/trackController";
import { processQuery } from "./controllers/processController";
import fs from "fs";
import path from "path";
// import { processPlaylist } from "./spotify";

dotenv.config();

export const startServer = () => {
  const app = new Koa();
  const router = new Router();

  app.use(bodyParser());

  // Serve static files from public directory
  app.use(serve(path.join(__dirname, "../public")));

  router.get("/", async (ctx: Context) => {
    try {
      const htmlPath = path.join(
        __dirname,
        "templates",
        "index.html",
      );
      const html = fs.readFileSync(htmlPath, "utf-8");
      ctx.type = "text/html";
      ctx.body = html;
    } catch (error) {
      console.error("Error reading HTML template:", error);
      ctx.status = 500;
      ctx.body = "Internal Server Error";
    }
  });

  // API routes with /api/ prefix
  router.get("/api/health", getHealth);
  router.get("/api/search", searchTracks);
  router.get("/api/track/:id", getTrackDetails);
  router.post("/api/process", processQuery);

  // router.get("/playlist/:id", async (ctx: Context) => {
  //   // ctx.body = ctx.params.id;
  //   ctx.body = await processPlaylist(ctx.params.id);
  // });

  app.use(router.routes()).use(router.allowedMethods());

  app.listen(process.env.SERVER_PORT, () => {
    console.log(
      `Server is running on http://localhost:${process.env.SERVER_PORT}`,
    );
  });
};
