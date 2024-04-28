import * as dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import {
  getPlaylistId,
  getTrackDetails,
  getTrackId,
  getPlaylist,
} from "./spotify";
dotenv.config();

class Bot {
  instance: Telegraf;

  constructor() {
    if (typeof process.env.BOT_TOKEN !== "string")
      throw new Error("BOT_TOKEN is not provided");

    this.instance = new Telegraf(process.env.BOT_TOKEN);

    process.once("SIGINT", () => this.instance.stop("SIGINT"));
    process.once("SIGTERM", () => this.instance.stop("SIGTERM"));

    this.instance.on(message("text"), async (ctx) => {
      try {
        const messageText = ctx.message.text;

        if (messageText === "/start") {
          await ctx.reply(
            "Hi, I'm SpotifyMeowBot. Send me the link to your desired song from Spotify, and I will return the BPM info. Or send me a playlist link, and I will provide the BPMs for all the songs in the playlist.",
          );
          return;
        }

        const trackId = getTrackId(messageText);
        const playlistId = getPlaylistId(messageText);
        if (trackId) {
          await ctx.sendChatAction("typing");
          const details = await getTrackDetails(trackId);

          await ctx.replyWithMarkdown(`
Title: *${details.title}*
Artist: *${details.artist}*
Album: *${details.album}*${
            details.label
              ? `
Label: *${details.label}*`
              : ""
          }

Release Date: *${details.releaseDate}*

BPM: *${Math.round(details.bpm * 10) / 10}*
          `);
        } else if (playlistId) {
          await ctx.sendChatAction("typing");
          const playlist = await getPlaylist(playlistId);
          await ctx.replyWithMarkdown(`
Title: *${playlist.playlistName}*
Owner: *${playlist.ownerName}*
Length: *${playlist.length}*
Median BPM: *${Math.round(playlist.medianBPM * 10) / 10}*

Tracks:
${playlist.tracks
  .sort((a, b) => a.bpm - b.bpm)
  .map(
    (item) =>
      `*${Math.round(item.bpm * 10) / 10}bpm* | ${item.artist} - ${
        item.title
      }`,
  )
  .join("\n")}

          `);
        } else {
          await ctx.reply(
            "Wrong url format. Share the Spotify song link or playlist link. For example: https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
          );
        }
      } catch (error) {
        console.error(error);
        await ctx.reply("An error occurred. Please try again later.");
      }
    });
  }

  start() {
    console.log("Bot @SpotifyMeowBot started");
    this.instance
      .launch()
      .then(() => {})
      .catch(console.error);
  }
}

const bot = new Bot();

export default bot;
