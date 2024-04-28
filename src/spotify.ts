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

  async authorizeApi() {
    try {
      const creds = await this.instance.clientCredentialsGrant();
      console.log("creds", creds);

      this.instance.setAccessToken(creds.body["access_token"]);
    } catch (e) {
      logError(e);
    }
  }
}

export const spotifyClient = new SpotifyClient();
export const spotifyApi = spotifyClient.instance;

const cacheDir = "./cache";
const audioFeaturesDir = path.join(cacheDir, "audioFeatures");
const trackDataDir = path.join(cacheDir, "trackData");
const playlistsDir = path.join(cacheDir, "playlists");
// const pauseSeconds = 2; // Пауза в секундах
// const limit = 50; // Лимит треков на одну итерацию

// Функции работы с кэшем
function readCache(cachePath: string) {
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
  }
  return null;
}

function writeCache(cachePath: string, data: any) {
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), "utf-8");
}

async function fetchAllPlaylistTracks(playlistId: string) {
  let tracks: any[] = [];
  let offset = 0;
  const limit = 100;

  async function fetch() {
    const response = await spotifyApi.getPlaylistTracks(playlistId, {
      limit,
      offset,
    });
    tracks = tracks.concat(response.body.items);
    if (response.body.next) {
      offset += limit;
      await fetch();
    }
  }

  await fetch();
  return tracks;
}

async function fetchPlaylist(playlistId: string) {
  const cachePath = path.join(playlistsDir, `${playlistId}.json`);
  const data = readCache(cachePath);

  if (!data) {
    const tracks = await fetchAllPlaylistTracks(playlistId);
    const playListData = (await spotifyApi.getPlaylist(playlistId))
      .body;
    const newData = { ...playListData, tracks };
    writeCache(cachePath, newData);
    return newData;
  }

  return data;
}

async function fetchAudioFeatures(trackId: string) {
  const cachePath = path.join(audioFeaturesDir, `${trackId}.json`);
  let data = readCache(cachePath);
  if (!data) {
    // console.log("Fetching", trackId);
    data = (await spotifyApi.getAudioFeaturesForTrack(trackId)).body;
    writeCache(cachePath, data);
  } else {
    // console.log("Cached", trackId);
  }
  return data;
}

async function fetchTrackData(trackId: string) {
  const cachePath = path.join(trackDataDir, `${trackId}.json`);
  let data = readCache(cachePath);
  if (!data) {
    // console.log("Fetching", trackId);
    data = (await spotifyApi.getTrack(trackId)).body;
    writeCache(cachePath, data);
  } else {
    // console.log("Cached", trackId);
  }
  return data;
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
  };

  return result;
};

export async function processPlaylist(playlistId: string) {
  const playlist = await fetchPlaylist(playlistId);
  const tracks = playlist.tracks;
  const tracksWithInfo = [];

  for (const trackItem of tracks) {
    const trackId = trackItem.track.id;
    if (trackId) {
      const info = await fetchAudioFeatures(trackId);
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

export async function getPlaylist(playlistId: string) {
  const playlist = await fetchPlaylist(playlistId);
  const tracks = playlist.tracks;
  const tracksWithInfo = [];

  for (const trackItem of tracks) {
    const trackId = trackItem.track.id;
    if (trackId) {
      const info = await fetchAudioFeatures(trackId);
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
    medianBPM: getInfo(tracksWithInfo, "tempo").median,
    tracks: tracksWithInfo.map((item) => ({
      title: item.name,
      artist: item.artists
        .map((artist: { name: string }) => artist.name)
        .join(", "),
      bpm: item.tempo,
    })),
  };
}

export async function getTrackDetails(trackId: string) {
  const trackData = await fetchTrackData(trackId);
  const trackFeatures = await fetchAudioFeatures(trackId);

  const result = {
    title: trackData.name,
    artist: trackData.artists
      .map((artist: { name: string }) => artist.name)
      .join(", "),
    album: trackData.album.name,
    // @ts-ignore-next-line
    label: trackData.album.label,
    releaseDate: trackData.album.release_date,
    bpm: trackFeatures.tempo,
  };

  return result;
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
