export const info = {
  danceability:
    "Danceability: Measures the suitability of a track for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity. Values range from 0.0 (least danceable) to 1.0 (most danceable).",
  energy:
    "Energy: A measure of intensity and activity. Typically, energetic tracks feel fast, loud, and noisy. Like danceability, energy also ranges from 0.0 to 1.0, where higher values mean more energetic tracks.",
  key: "Indicates the key the track is in. This is represented by integers where each number corresponds to a pitch class notation (e.g., 0 = C, 1 = C# or Db, 2 = D, and so on).",
  loudness:
    "The overall loudness of a track in decibels (dB). Loudness values are averaged across the entire track and are useful for comparing relative loudness of tracks. Loudness levels are typically between -60 and 0 db.",
  mode: "Indicates the modality (major or minor) of a track. Major is represented by 1 and minor is 0.",
  speechiness:
    "Detects the presence of spoken words in a track. A speechiness value above 0.66 typically indicates that the track is probably made entirely of spoken words (like talk shows, audiobooks, etc.). Values between 0.33 and 0.66 describe tracks that may contain both music and speech, either in sections or layered, including such cases as rap music. Values below 0.33 most likely represent music and other non-speech-like tracks.",
  acousticness:
    "A measure of whether a track is acoustic. 1.0 represents high confidence the track is acoustic.",
  instrumentalness:
    "Predicts whether a track contains no vocals. The closer the instrumentalness value is to 1.0, the greater likelihood the track contains no vocal content (those values above 0.5 are intended to represent instrumental tracks, but the confidence is higher as the value approaches 1.0).",
  liveness:
    "Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live. A value above 0.8 typically suggests that the track is live.",
  valence:
    "Valence: A measure describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g., happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g., sad, depressed, angry).",
  tempo:
    "BPM: The overall estimated tempo of a track in beats per minute (BPM). In musical terminology, tempo is the speed or pace of a given piece and derives directly from the average beat duration.",
};
