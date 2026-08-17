import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export const ffmpeg = new FFmpeg();

let loaded = false;

export async function loadFFmpeg() {
  if (loaded) return;

  await ffmpeg.load();

  loaded = true;
}

export async function writeVideo(
  name: string,
  url: string
) {
  const file = await fetchFile(url);

  await ffmpeg.writeFile(name, file);
}