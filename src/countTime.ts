export function countSeconds(input: string): number {
  const lines = input.trim().split("\n");
  let totalSeconds = 0;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return; // Ignore empty lines

    let timeParts: string[];

    if (index === 0) {
      // First line can have format "00:00"
      timeParts = trimmedLine.split(" ");
    } else {
      // For all other lines format should be "mm:ss mm:ss"
      timeParts = trimmedLine.match(/\d{2}:\d{2}/g) || [];
      if (timeParts.length === 0) {
        throw new Error(
          `Invalid format on line ${index + 1}: "${line}"`,
        );
      }
    }

    const start = timeParts.length === 1 ? "00:00" : timeParts[0];
    const end = timeParts.length === 1 ? timeParts[0] : timeParts[1];

    const startSeconds = convertToSeconds(start);
    const endSeconds = convertToSeconds(end);

    totalSeconds += endSeconds - startSeconds;
  });

  return totalSeconds;
}

export function convertToSeconds(time: string): number {
  const [minutes, seconds] = time.split(":").map(Number);
  return minutes * 60 + seconds;
}

export const getFormatTime = (totalSeconds: number) => {
  let hours = Math.floor(totalSeconds / 3600);
  let minutes = Math.floor((totalSeconds % 3600) / 60);
  let seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
};

export function countNonZeroIntervals(input: string): number {
  const lines = input.trim().split("\n");
  let nonZeroCount = 0;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return; // Ignore empty lines

    let timeParts: string[];

    if (index === 0) {
      // First line can have format "00:00"
      timeParts = trimmedLine.split(" ");
    } else {
      // For all other lines format should be "mm:ss mm:ss"
      timeParts = trimmedLine.match(/\d{2}:\d{2}/g) || [];
      if (timeParts.length === 0) {
        throw new Error(
          `Invalid format on line ${index + 1}: "${line}"`,
        );
      }
    }

    const start = timeParts.length === 1 ? "00:00" : timeParts[0];
    const end = timeParts.length === 1 ? timeParts[0] : timeParts[1];

    const startSeconds = convertToSeconds(start);
    const endSeconds = convertToSeconds(end);

    if (endSeconds - startSeconds > 0) {
      nonZeroCount++;
    }
  });

  return nonZeroCount;
}

export function getMedianIntervalLength(input: string): number {
  const intervals: number[] = [];

  const lines = input.trim().split("\n");

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return; // Ignore empty lines

    let timeParts: string[];

    if (index === 0) {
      // First line can have format "00:00"
      timeParts = trimmedLine.split(" ");
    } else {
      // For all other lines format should be "mm:ss mm:ss"
      timeParts = trimmedLine.match(/\d{2}:\d{2}/g) || [];
      if (timeParts.length === 0) {
        throw new Error(
          `Invalid format on line ${index + 1}: "${line}"`,
        );
      }
    }

    const start = timeParts.length === 1 ? "00:00" : timeParts[0];
    const end = timeParts.length === 1 ? timeParts[0] : timeParts[1];

    const startSeconds = convertToSeconds(start);
    const endSeconds = convertToSeconds(end);

    const intervalLength = endSeconds - startSeconds;
    if (intervalLength > 0) {
      intervals.push(intervalLength);
    }
  });

  if (intervals.length === 0) {
    return 0; // If no non-zero intervals, median is 0
  }

  // Sort intervals
  intervals.sort((a, b) => a - b);

  const middle = Math.floor(intervals.length / 2);

  // If even number of elements, return average of two middle values
  if (intervals.length % 2 === 0) {
    return (intervals[middle - 1] + intervals[middle]) / 2;
  }

  // If odd number of elements, return the central element
  return intervals[middle];
}
