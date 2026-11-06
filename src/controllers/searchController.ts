import { Context } from "koa";
import { spotifyClient } from "../spotify";

export async function searchTracks(ctx: Context) {
  const query = ctx.query.q as string;

  if (!query) {
    ctx.status = 400;
    ctx.body = { error: "Query parameter 'q' is required" };
    return;
  }

  try {
    const results = await spotifyClient.searchTrack(query);
    ctx.body = { results };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "Failed to search tracks" };
  }
}
