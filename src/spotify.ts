import * as dotenv from "dotenv";
import path from "path";
import SpotifyWebApi from "spotify-web-api-node";
import fs from "fs";
import { info } from "./info";
import { logError } from "./utils/logError";

dotenv.config();

class SpotifyClient {
  instance: SpotifyWebApi;
  constructor() {
    if (!process.env.SPOTIFY_CLIENT_ID)
      throw new Error("SPOTIFY_CLIENT_ID is not provided");
    if (!process.env.SPOTIFY_CLIENT_SECRET)
      throw new Error("SPOTIFY_CLIENT_SECRET is not provided");

    this.instance = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    this.authorizeApi();
  }

  async instanceCallWrapper(
    callName: keyof SpotifyWebApi,
    ...args: any[]
  ) {
    try {
      // @ts-ignore
      return await this.instance[callName](...args);
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        e.message.includes("The access token expired")
      ) {
        console.log("The access token expired");
        await this.authorizeApi();
        // @ts-ignore
        return await this.instance[callName](...args);
      } else {
        logError(e);
      }
    }
  }

  async authorizeApi() {
    try {
      const creds = await this.instance.clientCredentialsGrant();

      this.instance.setAccessToken(creds.body["access_token"]);
    } catch (e) {
      logError(e);
    }
  }

  async fetchAllPlaylistTracks(playlistId: string) {
    let tracks: any[] = [];
    let offset = 0;
    const limit = 100;

    const fetch = async () => {
      const response = await this.instanceCallWrapper(
        "getPlaylistTracks",
        playlistId,
        {
          limit,
          offset,
        },
      );
      tracks = tracks.concat(response.body.items);
      if (response.body.next) {
        offset += limit;
        await fetch();
      }
    };

    try {
      await fetch();
    } catch (e) {
      logError(e);
    }
    return tracks;
  }

  async fetchPlaylist(playlistId: string) {
    // const cachePath = path.join(playlistsDir, `${playlistId}.json`);
    // const data = readCache(cachePath);
    const data = null;

    if (!data) {
      const tracks = await this.fetchAllPlaylistTracks(playlistId);
      let playListData = {} as any;
      try {
        playListData = await this.instanceCallWrapper(
          "getPlaylist",
          playlistId,
        );
      } catch (e) {
        logError(e);
      }
      const playListDataBody = playListData.body;
      const newData = { ...playListDataBody, tracks };
      // writeCache(cachePath, newData);
      return newData;
    }

    return data;
  }

  async processPlaylist(playlistId: string) {
    const playlist = await this.fetchPlaylist(playlistId);
    const tracks = playlist.tracks;
    const tracksWithInfo = [];

    for (const trackItem of tracks) {
      const trackId = trackItem.track.id;
      if (trackId) {
        const info = await this.fetchAudioFeatures(trackId);
        tracksWithInfo.push({
          ...trackItem.track,
          ...info,
        });
      }
    }

    return {
      playlistName: playlist.name,
      ownerName: playlist.owner.display_name,
      length: playlist.tracks.length,
      info: {
        bpm: getInfo(tracksWithInfo, "tempo"),
        energy: getInfo(tracksWithInfo, "energy"),
        valence: getInfo(tracksWithInfo, "valence"),
        danceability: getInfo(tracksWithInfo, "danceability"),
      },
    };
  }

  async fetchAudioFeatures(trackId: string) {
    if (!isSpotifyId(trackId)) throw new Error("Invalid Spotify ID");
    const cachePath = path.join(audioFeaturesDir, `${trackId}.json`);
    let data = readCache(cachePath);
    if (!data) {
      // console.log("Fetching", trackId);
      try {
        data = (
          await this.instanceCallWrapper(
            "getAudioFeaturesForTrack",
            trackId,
          )
        )?.body;
        // data = (await this.instance.getAudioFeaturesForTrack(trackId))
        //   .body;
      } catch (e) {
        logError(e);
      }
      writeCache(cachePath, data);
    } else {
      // console.log("Cached", trackId);
    }
    return data;
  }

  async fetchTrackData(trackId: string) {
    if (!isSpotifyId(trackId)) throw new Error("Invalid Spotify ID");
    const cachePath = path.join(trackDataDir, `${trackId}.json`);
    let data = readCache(cachePath);
    if (!data) {
      // console.log("Fetching", trackId);
      try {
        data = (await this.instanceCallWrapper("getTrack", trackId))
          .body;
      } catch (e) {
        logError(e);
      }
      writeCache(cachePath, data);
    } else {
      // console.log("Cached", trackId);
    }
    return data;
  }

  async getPlaylist(playlistId: string) {
    const playlist = await this.fetchPlaylist(playlistId);
    const tracks = playlist.tracks;
    const tracksWithInfo = [];

    for (const trackItem of tracks) {
      const trackId = trackItem.track.id;
      if (trackId) {
        // const info = await this.fetchAudioFeatures(trackId);
        tracksWithInfo.push({
          id: trackId,
          ...trackItem.track,
          ...info,
        });
      }
    }

    return {
      playlistName: playlist.name,
      ownerName: playlist.owner.display_name,
      length: playlist.tracks.length,
      medianBPM: getInfo(tracksWithInfo, "tempo").median,
      tracks: tracksWithInfo.map((item) => ({
        id: item.id,
        title: item.name,
        artist: item.artists
          .map((artist: { name: string }) => artist.name)
          .join(", "),
        bpm: Math.round(item.tempo * 10) / 10,
        fullTitle: `${item.artists[0].name} - ${item.name}`,
      })),
    };
  }

  async getTrackDetails(trackId: string) {
    const trackData = await this.fetchTrackData(trackId);
    console.log("trackData", trackData);
    // const trackFeatures =
    //   (await this.fetchAudioFeatures(trackId)) || {};
    // console.log("trackFeaturest", trackFeatures);

    const result = {
      title: trackData.name,
      artist: trackData.artists
        .map((artist: { name: string }) => artist.name)
        .join(", "),
      album: trackData.album.name,
      // @ts-ignore-next-line
      label: trackData.album.label,
      releaseDate: trackData.album.release_date,
      // bpm: trackFeatures
      //   ? Math.round(trackFeatures.tempo * 10) / 10
      //   : 0,
      // energy: trackFeatures ? trackFeatures.energy : "",
      // key: trackFeatures
      //   ? `${trackFeatures.key + 1}${
      //       parseInt(trackFeatures.mode) === 1 ? "B" : "A"
      //     }`
      //   : "",
    };

    return result;
  }

  async searchTrack(query: string) {
    try {
      const response = await this.instanceCallWrapper(
        "searchTracks",
        query,
        {
          limit: 20, // First page of results
          type: "track",
        },
      );

      if (!response || !response.body || !response.body.tracks) {
        return "No tracks found";
      }

      const tracks = response.body.tracks.items;

      if (tracks.length === 0) {
        return "No tracks found";
      }

      const results = tracks.map((track: any) => {
        const artist = track.artists
          .map((artist: { name: string }) => artist.name)
          .join(", ");
        const title = track.name;
        const spotifyUrl = track.external_urls.spotify;

        return `${artist} - ${title} | ${spotifyUrl}`;
      });

      return results.join("\n");
    } catch (e) {
      logError(e);
      return "Error searching for tracks";
    }
  }
}

export const spotifyClient = new SpotifyClient();
// export const spotifyApi = spotifyClient.instance;

const cacheDir = "./cache";
const audioFeaturesDir = path.join(cacheDir, "audioFeatures");
const trackDataDir = path.join(cacheDir, "trackData");
const playlistsDir = path.join(cacheDir, "playlists");

function readCache(cachePath: string) {
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
  }
  return null;
}

function writeCache(cachePath: string, data: any) {
  try {
    fs.writeFileSync(
      cachePath,
      JSON.stringify(data, null, 2),
      "utf-8",
    );
  } catch (e) {
    logError(e);
  }
}

const getInfo = (tracks: any[], key: string) => {
  const values = tracks.map((track) => track[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sorted = values.sort((a, b) => a - b);
  const median = sorted[Math.floor(values.length / 2)];
  // @ts-ignore-next-line
  const description = info[key];
  const result = {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    median: Math.round(median * 10) / 10,
    description,
    energy: info.energy,
    tone: `${info.key + 1}${info.mode === "0" ? "A" : "B"}`,
  };

  return result;
};

// Spotify IDs are base62; also keeps cache file names inside the cache dirs
export function isSpotifyId(id: string) {
  return /^[a-zA-Z0-9]+$/.test(id);
}

export function getTrackId(input: string) {
  const regex =
    /^https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)(\?.*)?$/;
  const match = input.match(regex);

  if (match) {
    return match[1];
  } else {
    return null;
  }
}

export function getPlaylistId(input: string) {
  const regex =
    /^https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)(\?.*)?$/;
  const match = input.match(regex);

  if (match) {
    return match[1];
  } else {
    return null;
  }
}
