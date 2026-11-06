import { Context } from "koa";

export async function getHealth(ctx: Context) {
  ctx.body = { status: "ok", timestamp: new Date().toISOString() };
}
