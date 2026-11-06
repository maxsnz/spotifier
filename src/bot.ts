import * as dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { getPlaylistId, getTrackId, spotifyClient } from "./spotify";
import { logError } from "./utils/logError";
import {
  countNonZeroIntervals,
  countSeconds,
  getFormatTime,
  getMedianIntervalLength,
} from "./countTime";
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
        console.log("messageText", messageText);

        if (messageText === "/start") {
          await ctx.reply(
            "Hi, I'm SpotifyMeowBot. Send me the link to your desired song from Spotify, and I will return track info. Or send me a playlist link, and I will provide info for all the songs in the playlist.",
          );
          return;
        }

        if (messageText.startsWith("/count")) {
          const input = messageText.replace("/count", "");
          const seconds = countSeconds(input);
          const intervalsCount = countNonZeroIntervals(input);
          const medianTrackLength = getMedianIntervalLength(input);
          const result = getFormatTime(seconds);
          await ctx.replyWithMarkdown(`
tracks count: *${intervalsCount}*
total time: *${result}*
average track length: *${getFormatTime(
            Math.round(seconds / intervalsCount),
          )}*
median track length: *${getFormatTime(Math.round(medianTrackLength))}*
            `);
          return;
        }

        // If message contains ' - ', treat it as a search query
        if (messageText.includes(" - ")) {
          const query = messageText.trim();
          await ctx.sendChatAction("typing");
          try {
            const results = await spotifyClient.searchTrack(query);
            await ctx.reply(results);
          } catch (error) {
            logError(error);
            await ctx.reply(
              "An error occurred while searching for tracks. Please try again later.",
            );
          }
          return;
        }

        // Optionally, keep /search for compatibility
        if (messageText.startsWith("/search")) {
          const query = messageText.replace("/search", "").trim();

          if (!query) {
            await ctx.reply(
              "Please provide a search query. Example: /search The Beatles - Hey Jude",
            );
            return;
          }

          await ctx.sendChatAction("typing");
          try {
            const results = await spotifyClient.searchTrack(query);
            await ctx.reply(results);
          } catch (error) {
            logError(error);
            await ctx.reply(
              "An error occurred while searching for tracks. Please try again later.",
            );
          }
          return;
        }

        const trackId = getTrackId(messageText);
        const playlistId = getPlaylistId(messageText);
        if (trackId) {
          await ctx.sendChatAction("typing");
          const details =
            (await spotifyClient.getTrackDetails(trackId)) || {};

          await ctx.replyWithMarkdown(`
*${details.artist}* - *${details.title}*

Title: *${details.title}*
Artist: *${details.artist}*
Album: *${details.album}*${
            details.label
              ? `
Label: *${details.label}*`
              : ""
          }

Release Date: *${details.releaseDate}*
          `);
        } else if (playlistId) {
          await ctx.sendChatAction("typing");
          const playlist = await spotifyClient.getPlaylist(
            playlistId,
          );
          await ctx.replyWithMarkdown(`
Title: *${playlist.playlistName}*
Owner: *${playlist.ownerName}*
Length: *${playlist.length}*

Tracks:
${playlist.tracks
  // .sort((a, b) => {
  //   if (a.fullTitle < b.fullTitle) {
  //     return -1;
  //   }
  //   if (a.fullTitle > b.fullTitle) {
  //     return 1;
  //   }
  //   return 0;
  // })
  .map(
    (item) => `${item.artist} - ${item.title}`,
    // `https://open.spotify.com/track/${item.id}`,
    // `${item.fullTitle}`,
  )
  .join("\n")}

          `);
        } else {
          await ctx.reply(
            "Wrong url format. Share the Spotify song link or playlist link. For example: https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
          );
        }
      } catch (error) {
        logError(error);
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
