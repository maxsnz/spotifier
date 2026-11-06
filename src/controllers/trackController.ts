import { Context } from "koa";
import { isSpotifyId, spotifyClient } from "../spotify";

export async function getTrackDetails(ctx: Context) {
  const trackId = ctx.params.id;

  if (!trackId) {
    ctx.status = 400;
    ctx.body = { error: "Track ID is required" };
    return;
  }

  if (!isSpotifyId(trackId)) {
    ctx.status = 400;
    ctx.body = { error: "Invalid track ID" };
    return;
  }

  try {
    const details = await spotifyClient.getTrackDetails(trackId);

    if (!details) {
      ctx.status = 404;
      ctx.body = { error: "Track not found" };
      return;
    }

    ctx.body = {
      title: details.title,
      artist: details.artist,
      album: details.album,
      label: details.label,
      releaseDate: details.releaseDate,
      spotifyUrl: `https://open.spotify.com/track/${trackId}`,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "Failed to get track details" };
  }
}
