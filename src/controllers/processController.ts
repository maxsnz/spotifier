import { Context } from "koa";
import { spotifyClient, getTrackId, getPlaylistId } from "../spotify";

export async function processQuery(ctx: Context) {
  const body = ctx.request.body as { query?: string };
  const { query } = body;

  if (!query) {
    ctx.status = 400;
    ctx.body = { error: "Query is required" };
    return;
  }

  try {
    const trackId = getTrackId(query);
    const playlistId = getPlaylistId(query);

    if (trackId) {
      // Process track
      const details = await spotifyClient.getTrackDetails(trackId);
      if (!details) {
        ctx.body = { result: "Track not found" };
        return;
      }

      const result = `${details.artist} - ${details.title}

Title: ${details.title}
Artist: ${details.artist}
Album: ${details.album}${
        details.label ? `\nLabel: ${details.label}` : ""
      }

Release Date: ${details.releaseDate}`;

      ctx.body = { result };
    } else if (playlistId) {
      // Process playlist
      const playlist = await spotifyClient.getPlaylist(playlistId);

      const result = `Title: ${playlist.playlistName}
Owner: ${playlist.ownerName}
Length: ${playlist.length}

Tracks:
${playlist.tracks
  .map((item) => `${item.artist} - ${item.title}`)
  .join("\n")}`;

      ctx.body = { result };
    } else if (query.includes(" - ")) {
      // Search query
      const results = await spotifyClient.searchTrack(query);
      ctx.body = { result: results };
    } else {
      ctx.body = {
        result:
          "Wrong format. Share a Spotify song link, playlist link, or search query (e.g., 'Artist - Title')",
      };
    }
  } catch (error) {
    console.error("Error processing query:", error);
    ctx.status = 500;
    ctx.body = {
      error: "An error occurred. Please try again later.",
    };
  }
}
