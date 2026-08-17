"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loaded = false;

// =====================================================
// LOAD FFMPEG
// =====================================================

async function loadFFmpeg() {
  if (loaded && ffmpeg) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  const baseURL =
    "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

  await ffmpeg.load({
    coreURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      "text/javascript"
    ),

    wasmURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm"
    ),
  });

  loaded = true;

  return ffmpeg;
}

// =====================================================
// SAFE DELETE
// =====================================================

async function deleteFile(
  ff: FFmpeg,
  filename: string
) {
  try {
    await ff.deleteFile(filename);
  } catch {
    // File may not exist.
  }
}

// =====================================================
// CLEAN OLD FILES
// =====================================================

async function cleanupFFmpegFiles(
  ff: FFmpeg
) {
  const files = [
    "voice.wav",
    "concat.txt",
    "combined.mp4",
    "final.mp4",
    "source.mp4",
  ];

  for (const file of files) {
    await deleteFile(ff, file);
  }

  // Clean possible old normalized clips.
  for (let i = 0; i < 30; i++) {
    await deleteFile(
      ff,
      `clip${i}.mp4`
    );
  }
}

// =====================================================
// DOWNLOAD ONE CLIP
// =====================================================

async function downloadClip(
  url: string
): Promise<Uint8Array> {

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Unable to download video (${response.status})`
    );
  }

  const blob =
    await response.blob();

  return new Uint8Array(
    await blob.arrayBuffer()
  );
}

// =====================================================
// CLEAN DRAW TEXT
// =====================================================

function cleanText(
  text: string
) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/,/g, "\\,")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/;/g, "\\;");
}

// =====================================================
// GET SCENE DURATION
// =====================================================

function getDuration(
  time: number | string
) {

  const value =
    Number(time);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 4;
  }

  return value;
}

// =====================================================
// RENDER SHORT
// =====================================================

export async function renderShort({
  clips,
  voice,
  scenes,
  onProgress,
}: {
  clips: string[];

  voice: Uint8Array;

  scenes: {
    time: number | string;
    onscreen_text: string;
  }[];

  onProgress?: (
    progress: number
  ) => void;
}): Promise<Blob> {

  if (
    !clips ||
    clips.length === 0
  ) {
    throw new Error(
      "No video clips were provided."
    );
  }

  if (!voice || voice.length === 0) {
    throw new Error(
      "Voice audio is missing."
    );
  }

  if (
    !scenes ||
    scenes.length === 0
  ) {
    throw new Error(
      "No scenes were provided."
    );
  }

  // ---------------------------------------------------
  // LOAD
  // ---------------------------------------------------

  const ff =
    await loadFFmpeg();

  onProgress?.(3);

  // ---------------------------------------------------
  // CLEAN PREVIOUS RUN
  // ---------------------------------------------------

  await cleanupFFmpegFiles(
    ff
  );

  onProgress?.(5);

  // ---------------------------------------------------
  // WRITE VOICE
  // ---------------------------------------------------

  await ff.writeFile(
    "voice.wav",
    voice
  );

  onProgress?.(10);

  // ---------------------------------------------------
  // PROCESS CLIPS ONE AT A TIME
  //
  // IMPORTANT:
  // We DO NOT keep all Pexels originals
  // inside FFmpeg memory.
  // ---------------------------------------------------

  for (
    let i = 0;
    i < clips.length;
    i++
  ) {

    if (!clips[i]) {
      throw new Error(
        `Missing video for scene ${i + 1}.`
      );
    }

    // -----------------------------------------------
    // DOWNLOAD
    // -----------------------------------------------

    onProgress?.(
      10 +
        Math.round(
          (i / clips.length) * 25
        )
    );

    const data =
      await downloadClip(
        clips[i]
      );

    // -----------------------------------------------
    // WRITE TEMP SOURCE
    // -----------------------------------------------

    const sourceName =
      `source.mp4`;

    await deleteFile(
      ff,
      sourceName
    );

    await ff.writeFile(
      sourceName,
      data
    );

    // -----------------------------------------------
    // NORMALIZE
    // -----------------------------------------------

    const duration =
      getDuration(
        scenes[i]?.time
      );

    const outputName =
      `clip${i}.mp4`;

    await deleteFile(
      ff,
      outputName
    );

    /*
     * -stream_loop -1
     *
     * If Pexels gives us a 2-second video
     * but the scene needs 4 seconds,
     * FFmpeg loops it instead of producing
     * a shorter clip.
     */

    await ff.exec([

      "-stream_loop",
      "-1",

      "-i",
      sourceName,

      "-t",
      String(duration),

      "-vf",
      "scale=1080:1920:" +
        "force_original_aspect_ratio=increase," +
        "crop=1080:1920," +
        "fps=30",

      "-an",

      "-c:v",
      "libx264",

      "-preset",
      "ultrafast",

      "-pix_fmt",
      "yuv420p",

      outputName,
    ]);

    // -----------------------------------------------
    // VERY IMPORTANT
    // DELETE ORIGINAL IMMEDIATELY
    // -----------------------------------------------

    await deleteFile(
      ff,
      sourceName
    );

    // Release JS memory too.
    // The Uint8Array is no longer needed.

    onProgress?.(
      35 +
        Math.round(
          ((i + 1) / clips.length) * 20
        )
    );
  }

  // ---------------------------------------------------
  // CONCAT FILE
  // ---------------------------------------------------

  let concatFile = "";

  for (
    let i = 0;
    i < clips.length;
    i++
  ) {

    concatFile +=
      `file 'clip${i}.mp4'\n`;
  }

  await ff.writeFile(
    "concat.txt",
    new TextEncoder().encode(
      concatFile
    )
  );

  // ---------------------------------------------------
  // CONCAT
  // ---------------------------------------------------

  await deleteFile(
    ff,
    "combined.mp4"
  );

  await ff.exec([

    "-f",
    "concat",

    "-safe",
    "0",

    "-i",
    "concat.txt",

    "-c",
    "copy",

    "combined.mp4",
  ]);

  onProgress?.(65);

  // ---------------------------------------------------
  // CAPTIONS
  // ---------------------------------------------------

  let filter = "";

  let currentTime = 0;

  scenes.forEach(
    (scene, index) => {

      const duration =
        getDuration(
          scene.time
        );

      const start =
        currentTime;

      const end =
        currentTime +
        duration;

      const text =
        cleanText(
          scene.onscreen_text ||
            ""
        );

      if (text) {

        filter +=
          `drawtext=` +
          `text='${text}':` +
          `fontcolor=white:` +
          `fontsize=58:` +
          `borderw=4:` +
          `bordercolor=black:` +
          `x=(w-text_w)/2:` +
          `y=h-300:` +
          `enable='between(t,${start},${end})'`;

        if (
          index <
          scenes.length - 1
        ) {
          filter += ",";
        }
      }

      currentTime =
        end;
    }
  );

  // ---------------------------------------------------
  // FINAL RENDER
  // ---------------------------------------------------

  await deleteFile(
    ff,
    "final.mp4"
  );

  const renderArgs = [

    "-i",
    "combined.mp4",

    "-i",
    "voice.wav",
  ];

  // Only use filter_complex if
  // captions actually exist.

  if (filter.trim()) {

    renderArgs.push(
      "-filter_complex",
      filter
    );
  }

  renderArgs.push(

    "-map",
    "0:v:0",

    "-map",
    "1:a:0",

    "-c:v",
    "libx264",

    "-preset",
    "ultrafast",

    "-pix_fmt",
    "yuv420p",

    "-c:a",
    "aac",

    "-b:a",
    "128k",

    "-shortest",

    "-movflags",
    "+faststart",

    "final.mp4"
  );

  await ff.exec(
    renderArgs
  );

  onProgress?.(95);

  // ---------------------------------------------------
  // READ FINAL VIDEO
  // ---------------------------------------------------

 // ---------------------------------------------------
// READ FINAL VIDEO
// ---------------------------------------------------

const output =
  await ff.readFile(
    "final.mp4"
  );

if (
  typeof output === "string"
) {
  throw new Error(
    "FFmpeg returned invalid video data."
  );
}

// ---------------------------------------------------
// CLEAN INTERMEDIATE FILES
// ---------------------------------------------------

await deleteFile(
  ff,
  "voice.wav"
);

await deleteFile(
  ff,
  "concat.txt"
);

await deleteFile(
  ff,
  "combined.mp4"
);

for (
  let i = 0;
  i < clips.length;
  i++
) {
  await deleteFile(
    ff,
    `clip${i}.mp4`
  );
}

// ---------------------------------------------------
// CREATE FINAL BLOB
// ---------------------------------------------------

const videoData =
  new Uint8Array(output);

const videoBlob =
  new Blob(
    [videoData],
    {
      type: "video/mp4",
    }
  );

onProgress?.(100);

return videoBlob;
}