import * as dotenv from "dotenv";
import Koa, { Context } from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import { processPlaylist } from "./spotify";

dotenv.config();

export const startServer = () => {
  const app = new Koa();
  const router = new Router();

  app.use(bodyParser());

  router.get("/", async (ctx: Context) => {
    ctx.body = "Hello from SpotifyMeowBot!";
  });

  router.get("/playlist/:id", async (ctx: Context) => {
    // ctx.body = ctx.params.id;
    ctx.body = await processPlaylist(ctx.params.id);
  });

  app.use(router.routes()).use(router.allowedMethods());

  app.listen(process.env.SERVER_PORT, () => {
    console.log(
      `Server is running on http://localhost:${process.env.SERVER_PORT}`,
    );
  });
};
