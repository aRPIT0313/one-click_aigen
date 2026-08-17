"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

// =====================================================
// TYPES
// =====================================================

type Scene = {
  time: number | string;
  onscreen_text: string;
};

type FFmpegFile = Uint8Array<ArrayBufferLike>;

// =====================================================
// CONSTANTS
// =====================================================

const WIDTH = 720;
const HEIGHT = 1280;
const FPS = 30;

const BASE_URL =
  "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

// =====================================================
// CREATE A COMPLETELY FRESH FFMPEG INSTANCE
// =====================================================

async function createFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  ffmpeg.on("log", ({ message }) => {
    console.log("[FFmpeg]", message);
  });

  ffmpeg.on("progress", ({ progress }) => {
    console.log(
      `[FFmpeg] progress: ${Math.round(progress * 100)}%`
    );
  });

  console.log("================================");
  console.log("Loading FFmpeg...");
  console.log("================================");

  await ffmpeg.load({
    coreURL: await toBlobURL(
      `${BASE_URL}/ffmpeg-core.js`,
      "text/javascript"
    ),

    wasmURL: await toBlobURL(
      `${BASE_URL}/ffmpeg-core.wasm`,
      "application/wasm"
    ),
  });

  console.log("FFmpeg loaded.");

  return ffmpeg;
}

// =====================================================
// SAFE DELETE
// =====================================================

async function safeDelete(
  ffmpeg: FFmpeg,
  filename: string
): Promise<void> {
  try {
    await ffmpeg.deleteFile(filename);
  } catch {
    // File may not exist.
  }
}

// =====================================================
// CHECK FILE
//
// FFmpeg WASM's FSNode does not expose .size.
// Therefore we read the file and check its byte length.
// =====================================================

async function assertFileExists(
  ffmpeg: FFmpeg,
  filename: string,
  label?: string
): Promise<Uint8Array<ArrayBuffer>> {
  let data;

  try {
    data = await ffmpeg.readFile(filename);
  } catch {
    throw new Error(
      `${label || filename} does not exist in FFmpeg filesystem.`
    );
  }

  if (typeof data === "string") {
    throw new Error(
      `${label || filename} returned text instead of binary data.`
    );
  }

  if (data.length === 0) {
    throw new Error(
      `${label || filename} exists but is 0 bytes.`
    );
  }

  console.log(
    `[FS] ${filename}: ${(data.length / 1024 / 1024).toFixed(2)} MB`
  );

  // Convert FFmpeg's Uint8Array<ArrayBufferLike>
  // into a normal Uint8Array<ArrayBuffer>.
  const buffer = new ArrayBuffer(data.length);
  const copy = new Uint8Array(buffer);

  copy.set(data);

  return copy;
}
// =====================================================
// DURATION
// =====================================================

function getDuration(
  time: number | string
): number {
  const value = Number(time);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 4;
  }

  return value;
}

// =====================================================
// DOWNLOAD CLIP
// =====================================================

async function downloadClip(
  url: string,
  sceneNumber: number
): Promise<Uint8Array<ArrayBuffer>> {
  console.log(
    `Downloading scene ${sceneNumber}...`
  );

  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      `Network error while downloading scene ${sceneNumber}: ${String(error)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Unable to download scene ${sceneNumber}. HTTP ${response.status}`
    );
  }

  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error(
      `Scene ${sceneNumber} returned a 0-byte video.`
    );
  }

  console.log(
    `Scene ${sceneNumber}: ${(blob.size / 1024 / 1024).toFixed(2)} MB`
  );

  const buffer =
    await blob.arrayBuffer();

  return new Uint8Array(buffer);
}

// =====================================================
// PREPARE ONE VIDEO
//
// Input:
// source.mp4
//
// Output:
// clip.mp4
//
// Every scene gets:
// 720x1280
// 30fps
// H264
// yuv420p
// NO AUDIO
// =====================================================

async function prepareClip(
  ffmpeg: FFmpeg,
  data: Uint8Array<ArrayBufferLike>,
  duration: number,
  sceneNumber: number
): Promise<void> {

  await safeDelete(
    ffmpeg,
    "source.mp4"
  );

  await safeDelete(
    ffmpeg,
    "clip.mp4"
  );

  console.log(
    `Writing scene ${sceneNumber}...`
  );

  // Make a safe ArrayBuffer-backed copy.
  const sourceData =
    new Uint8Array(data.length);

  sourceData.set(data);

  await ffmpeg.writeFile(
    "source.mp4",
    sourceData
  );

  // Verify input before encoding.
  await assertFileExists(
    ffmpeg,
    "source.mp4",
    `Scene ${sceneNumber} source`
  );

  console.log(
    `Encoding scene ${sceneNumber} for ${duration}s...`
  );

  const exitCode =
    await ffmpeg.exec([
      "-y",

      "-stream_loop",
      "-1",

      "-i",
      "source.mp4",

      "-t",
      String(duration),

      "-vf",
      [
        `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase`,
        `crop=${WIDTH}:${HEIGHT}`,
        `fps=${FPS}`,
        "format=yuv420p",
      ].join(","),

      "-an",

      "-c:v",
      "libx264",

      "-preset",
      "ultrafast",

      "-crf",
      "28",

      "-pix_fmt",
      "yuv420p",

      "-movflags",
      "+faststart",

      "clip.mp4",
    ]);

  console.log(
    `Scene ${sceneNumber} FFmpeg exit code: ${exitCode}`
  );

  if (exitCode !== 0) {
    throw new Error(
      `Scene ${sceneNumber} encoding failed. FFmpeg exit code: ${exitCode}`
    );
  }

  // Verify output.
  await assertFileExists(
    ffmpeg,
    "clip.mp4",
    `Scene ${sceneNumber} encoded clip`
  );

  await safeDelete(
    ffmpeg,
    "source.mp4"
  );

  console.log(
    `Scene ${sceneNumber} prepared successfully.`
  );
}

// =====================================================
// INITIAL MASTER
// =====================================================

async function createInitialMaster(
  ffmpeg: FFmpeg
): Promise<void> {

  await safeDelete(
    ffmpeg,
    "master.mp4"
  );

  await ffmpeg.rename(
    "clip.mp4",
    "master.mp4"
  );

  await assertFileExists(
    ffmpeg,
    "master.mp4",
    "Initial master"
  );
}

// =====================================================
// APPEND CLIP
//
// master.mp4 + clip.mp4
//        ↓
// master_new.mp4
//
// Uses concat demuxer with stream copy.
// =====================================================

async function appendClip(
  ffmpeg: FFmpeg,
  sceneNumber: number
): Promise<void> {

  await safeDelete(
    ffmpeg,
    "join.txt"
  );

  await safeDelete(
    ffmpeg,
    "master_new.mp4"
  );

  const concatFile =
    "file 'master.mp4'\n" +
    "file 'clip.mp4'\n";

  await ffmpeg.writeFile(
    "join.txt",
    new TextEncoder().encode(
      concatFile
    )
  );

  console.log(
    `Appending scene ${sceneNumber}...`
  );

  const exitCode =
    await ffmpeg.exec([
      "-y",

      "-f",
      "concat",

      "-safe",
      "0",

      "-i",
      "join.txt",

      "-c",
      "copy",

      "master_new.mp4",
    ]);

  console.log(
    `Concat exit code: ${exitCode}`
  );

  if (exitCode !== 0) {
    throw new Error(
      `Failed to append scene ${sceneNumber}. FFmpeg exit code: ${exitCode}`
    );
  }

  await assertFileExists(
    ffmpeg,
    "master_new.mp4",
    `Master after scene ${sceneNumber}`
  );

  await safeDelete(
    ffmpeg,
    "master.mp4"
  );

  await safeDelete(
    ffmpeg,
    "clip.mp4"
  );

  await safeDelete(
    ffmpeg,
    "join.txt"
  );

  await ffmpeg.rename(
    "master_new.mp4",
    "master.mp4"
  );

  await assertFileExists(
    ffmpeg,
    "master.mp4",
    `Master scene ${sceneNumber}`
  );
}

// =====================================================
// CREATE CAPTION PNG
//
// IMPORTANT:
//
// We do NOT use FFmpeg drawtext.
//
// Browser Canvas creates the transparent caption image.
// This avoids:
// - missing fonts in FFmpeg WASM
// - drawtext parsing problems
// - fontconfig problems
// - special-character escaping problems
// =====================================================

async function createCaptionPNG(
  text: string,
  sceneNumber: number
): Promise<Uint8Array<ArrayBuffer>> {

  if (
    typeof document === "undefined"
  ) {
    throw new Error(
      "Browser document is unavailable while creating captions."
    );
  }

  const canvas =
    document.createElement("canvas");

  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "Unable to create caption canvas."
    );
  }

  // Completely transparent background.
  ctx.clearRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );

  const clean =
    String(text || "")
      .trim();

  if (!clean) {
    // Transparent PNG.
    const emptyBlob =
      await new Promise<Blob>(
        (resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error(
                    "Unable to create empty caption PNG."
                  )
                );
                return;
              }

              resolve(blob);
            },
            "image/png"
          );
        }
      );

    return new Uint8Array(
      await emptyBlob.arrayBuffer()
    );
  }

  // ---------------------------------------------------
  // CAPTION STYLE
  // ---------------------------------------------------

  ctx.font =
    "bold 52px Arial, Helvetica, sans-serif";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  const maxWidth =
    WIDTH - 80;

  // ---------------------------------------------------
  // WORD WRAPPING
  // ---------------------------------------------------

  const words =
    clean.split(/\s+/);

  const lines: string[] = [];

  let currentLine = "";

  for (
    const word of words
  ) {

    const test =
      currentLine
        ? `${currentLine} ${word}`
        : word;

    const width =
      ctx.measureText(test).width;

    if (
      width > maxWidth &&
      currentLine
    ) {

      lines.push(
        currentLine
      );

      currentLine =
        word;

    } else {

      currentLine =
        test;
    }
  }

  if (currentLine) {
    lines.push(
      currentLine
    );
  }

  // Maximum 3 lines.
  const visibleLines =
    lines.slice(0, 3);

  const lineHeight = 68;

  const totalHeight =
    visibleLines.length *
    lineHeight;

  // Put captions near bottom.
  const centerY =
    HEIGHT - 250;

  const firstY =
    centerY -
    totalHeight / 2 +
    lineHeight / 2;

  // ---------------------------------------------------
  // DRAW
  // ---------------------------------------------------

  for (
    let i = 0;
    i < visibleLines.length;
    i++
  ) {

    const line =
      visibleLines[i];

    const y =
      firstY +
      i * lineHeight;

    // Strong shadow / outline.
    ctx.lineWidth = 12;
    ctx.strokeStyle =
      "rgba(0,0,0,0.85)";

    ctx.strokeText(
      line,
      WIDTH / 2,
      y
    );

    // Main text.
    ctx.fillStyle =
      "#ffffff";

    ctx.fillText(
      line,
      WIDTH / 2,
      y
    );
  }

  // ---------------------------------------------------
  // CANVAS → PNG
  // ---------------------------------------------------

  const blob =
    await new Promise<Blob>(
      (resolve, reject) => {

        canvas.toBlob(
          (result) => {

            if (!result) {
              reject(
                new Error(
                  `Unable to create caption PNG for scene ${sceneNumber}.`
                )
              );
              return;
            }

            resolve(result);
          },

          "image/png"
        );
      }
    );

  const buffer =
    await blob.arrayBuffer();

  const result =
    new Uint8Array(buffer);

  if (
    result.length === 0
  ) {
    throw new Error(
      `Caption PNG for scene ${sceneNumber} is 0 bytes.`
    );
  }

  console.log(
    `Caption ${sceneNumber}: ${(result.length / 1024).toFixed(1)} KB`
  );

  return result;
}

// =====================================================
// BUILD CAPTION IMAGES
// =====================================================

async function createCaptionFiles(
  ffmpeg: FFmpeg,
  scenes: Scene[]
): Promise<void> {

  for (
    let i = 0;
    i < scenes.length;
    i++
  ) {

    const text =
      scenes[i]?.onscreen_text || "";

    const data =
      await createCaptionPNG(
        text,
        i + 1
      );

    const filename =
      `caption${i}.png`;

    await safeDelete(
      ffmpeg,
      filename
    );

    await ffmpeg.writeFile(
      filename,
      data
    );

    await assertFileExists(
      ffmpeg,
      filename,
      `Caption ${i + 1}`
    );
  }
}

// =====================================================
// BUILD OVERLAY FILTER
//
// Inputs:
// 0:v = master video
// 1:a = voice
// 2:v = caption0.png
// 3:v = caption1.png
// ...
//
// Every caption image is looped forever and enabled
// only during its scene's time range.
// =====================================================

function buildOverlayFilter(
  scenes: Scene[]
): string {

  let currentTime = 0;

  let currentVideo =
    "[0:v]";

  const filters: string[] = [];

  for (
    let i = 0;
    i < scenes.length;
    i++
  ) {

    const duration =
      getDuration(
        scenes[i].time
      );

    const start =
      currentTime;

    const end =
      currentTime +
      duration;

    const next =
      `[v${i}]`;

    filters.push(
      `${currentVideo}[${i + 2}:v]overlay=0:0:enable='between(t,${start},${end})'${next}`
    );

    currentVideo =
      next;

    currentTime =
      end;
  }

  return filters.join(";");
}

// =====================================================
// FINAL RENDER
//
// IMPORTANT:
// We use PNG overlays instead of drawtext.
// =====================================================

async function renderFinal(
  ffmpeg: FFmpeg,
  scenes: Scene[],
  voice: Uint8Array<ArrayBufferLike>
): Promise<Blob> {

  // ---------------------------------------------------
  // WRITE VOICE
  // ---------------------------------------------------

  await safeDelete(
    ffmpeg,
    "voice.wav"
  );

  const voiceCopy =
    new Uint8Array(
      voice.length
    );

  voiceCopy.set(
    voice
  );

  await ffmpeg.writeFile(
    "voice.wav",
    voiceCopy
  );

  await assertFileExists(
    ffmpeg,
    "voice.wav",
    "Voice WAV"
  );

  // ---------------------------------------------------
  // VERIFY MASTER
  // ---------------------------------------------------

  await assertFileExists(
    ffmpeg,
    "master.mp4",
    "Master video"
  );

  // ---------------------------------------------------
  // CAPTION PNG FILES
  // ---------------------------------------------------

  await createCaptionFiles(
    ffmpeg,
    scenes
  );

  // ---------------------------------------------------
  // DELETE OLD OUTPUT
  // ---------------------------------------------------

  await safeDelete(
    ffmpeg,
    "final.mp4"
  );

  // ---------------------------------------------------
  // BUILD INPUTS
  // ---------------------------------------------------

  const command: string[] = [
    "-y",

    // Main video.
    "-i",
    "master.mp4",

    // Voice.
    "-i",
    "voice.wav",
  ];

  // Caption images.
  for (
    let i = 0;
    i < scenes.length;
    i++
  ) {

    command.push(
      "-loop",
      "1",

      "-i",
      `caption${i}.png`
    );
  }

  // ---------------------------------------------------
  // FILTER
  // ---------------------------------------------------

  const filter =
    buildOverlayFilter(
      scenes
    );

  console.log(
    "================================"
  );

  console.log(
    "FINAL FILTER:"
  );

  console.log(
    filter
  );

  console.log(
    "================================"
  );

  command.push(
    "-filter_complex",
    filter,

    "-map",
    `[v${scenes.length - 1}]`,

    "-map",
    "1:a:0",

    "-c:v",
    "libx264",

    "-preset",
    "ultrafast",

    "-crf",
    "28",

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

  console.log(
    "================================"
  );

  console.log(
    "STARTING FINAL FFMPEG RENDER"
  );

  console.log(
    "================================"
  );

  const exitCode =
    await ffmpeg.exec(
      command
    );

  console.log(
    "================================"
  );

  console.log(
    `FINAL FFmpeg EXIT CODE: ${exitCode}`
  );

  console.log(
    "================================"
  );

  if (
    exitCode !== 0
  ) {
    throw new Error(
      `Final FFmpeg render failed with exit code ${exitCode}. Check the FFmpeg logs above.`
    );
  }

  // ---------------------------------------------------
  // READ FINAL
  // ---------------------------------------------------

  const output =
    await assertFileExists(
      ffmpeg,
      "final.mp4",
      "Final MP4"
    );

  console.log(
    `Final video size: ${(output.length / 1024 / 1024).toFixed(2)} MB`
  );

  // ---------------------------------------------------
  // IMPORTANT TYPESCRIPT FIX
  //
  // Do NOT:
  //
  // new Blob([output])
  //
  // because newer TypeScript can infer
  // Uint8Array<ArrayBufferLike>.
  //
  // Instead explicitly copy to a normal ArrayBuffer.
  // ---------------------------------------------------

  const finalBuffer =
    new ArrayBuffer(
      output.length
    );

  const finalView =
    new Uint8Array(
      finalBuffer
    );

  finalView.set(
    output
  );

  return new Blob(
    [finalBuffer],
    {
      type: "video/mp4",
    }
  );
}

// =====================================================
// CLEANUP
// =====================================================

async function cleanup(
  ffmpeg: FFmpeg,
  scenes: Scene[]
): Promise<void> {

  const files: string[] = [

    "voice.wav",

    "source.mp4",

    "master.mp4",

    "master_new.mp4",

    "clip.mp4",

    "join.txt",

    "final.mp4",

  ];

  for (
    let i = 0;
    i < scenes.length;
    i++
  ) {

    files.push(
      `caption${i}.png`
    );
  }

  for (
    const file of files
  ) {

    await safeDelete(
      ffmpeg,
      file
    );
  }
}

// =====================================================
// MAIN RENDER FUNCTION
// =====================================================

export async function renderShort({
  clips,
  voice,
  scenes,
  onProgress,
}: {
  clips: string[];

  voice: Uint8Array<ArrayBufferLike>;

  scenes: Scene[];

  onProgress?: (
    progress: number
  ) => void;

}): Promise<Blob> {

  // ---------------------------------------------------
  // VALIDATION
  // ---------------------------------------------------

  if (
    !clips ||
    clips.length === 0
  ) {
    throw new Error(
      "No video clips were provided."
    );
  }

  if (
    !voice ||
    voice.length === 0
  ) {
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

  if (
    clips.length !==
    scenes.length
  ) {
    throw new Error(
      `Scene/video mismatch: ${scenes.length} scenes but ${clips.length} videos.`
    );
  }

  let ffmpeg:
    FFmpeg | null = null;

  try {

    console.log(
      "================================"
    );

    console.log(
      "STARTING LOCAL VIDEO RENDER"
    );

    console.log(
      `Scenes: ${scenes.length}`
    );

    console.log(
      "================================"
    );

    // -------------------------------------------------
    // FRESH FFMPEG
    // -------------------------------------------------

    onProgress?.(2);

    ffmpeg =
      await createFFmpeg();

    onProgress?.(5);

    // -------------------------------------------------
    // WRITE VOICE FIRST
    // -------------------------------------------------

    const voiceCopy =
      new Uint8Array(
        voice.length
      );

    voiceCopy.set(
      voice
    );

    await ffmpeg.writeFile(
      "voice.wav",
      voiceCopy
    );

    await assertFileExists(
      ffmpeg,
      "voice.wav",
      "Voice audio"
    );

    onProgress?.(8);

    // -------------------------------------------------
    // PROCESS EACH CLIP
    // -------------------------------------------------

    for (
      let i = 0;
      i < clips.length;
      i++
    ) {

      const sceneNumber =
        i + 1;

      console.log(
        "================================"
      );

      console.log(
        `SCENE ${sceneNumber}/${clips.length}`
      );

      console.log(
        "================================"
      );

      // -----------------------------------------------
      // DOWNLOAD
      // -----------------------------------------------

      onProgress?.(
        8 +
        Math.round(
          (i / clips.length) * 25
        )
      );

      const data =
        await downloadClip(
          clips[i],
          sceneNumber
        );

      // -----------------------------------------------
      // DURATION
      // -----------------------------------------------

      const duration =
        getDuration(
          scenes[i].time
        );

      console.log(
        `Scene ${sceneNumber} duration: ${duration}s`
      );

      // -----------------------------------------------
      // NORMALIZE
      // -----------------------------------------------

      await prepareClip(
        ffmpeg,
        data,
        duration,
        sceneNumber
      );

      // -----------------------------------------------
      // MASTER
      // -----------------------------------------------

      if (
        i === 0
      ) {

        await createInitialMaster(
          ffmpeg
        );

      } else {

        await appendClip(
          ffmpeg,
          sceneNumber
        );
      }

      // -----------------------------------------------
      // PROGRESS
      // -----------------------------------------------

      onProgress?.(
        35 +
        Math.round(
          ((i + 1) / clips.length) *
          25
        )
      );

      console.log(
        `Scene ${sceneNumber} complete.`
      );
    }

    // -------------------------------------------------
    // VERIFY MASTER BEFORE FINAL
    // -------------------------------------------------

    await assertFileExists(
      ffmpeg,
      "master.mp4",
      "Combined master video"
    );

    onProgress?.(62);

    // -------------------------------------------------
    // FINAL VIDEO
    // -------------------------------------------------

    console.log(
      "================================"
    );

    console.log(
      "RENDERING FINAL VIDEO"
    );

    console.log(
      "================================"
    );

    const finalVideo =
      await renderFinal(
        ffmpeg,
        scenes,
        voice
      );

    onProgress?.(96);

    // -------------------------------------------------
    // CLEANUP
    //
    // finalVideo is already an independent Blob,
    // so cleanup cannot invalidate it.
    // -------------------------------------------------

    await cleanup(
      ffmpeg,
      scenes
    );

    onProgress?.(100);

    console.log(
      "================================"
    );

    console.log(
      "VIDEO RENDER COMPLETE"
    );

    console.log(
      "================================"
    );

    return finalVideo;

  } catch (
    error: unknown
  ) {

    console.error(
      "================================"
    );

    console.error(
      "FFMPEG RENDERING FAILED"
    );

    console.error(
      error
    );

    console.error(
      "================================"
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    throw new Error(
      `Local video rendering failed: ${message}`
    );

  } finally {

    // -------------------------------------------------
    // CLEAN FILESYSTEM
    // -------------------------------------------------

    if (
      ffmpeg
    ) {

      try {

        await cleanup(
          ffmpeg,
          scenes
        );

      } catch (
        cleanupError
      ) {

        console.warn(
          "FFmpeg cleanup warning:",
          cleanupError
        );
      }

      // -------------------------------------------------
      // TERMINATE WASM
      // -------------------------------------------------

      try {

        ffmpeg.terminate();

      } catch {
        // Ignore termination errors.
      }
    }

    console.log(
      "FFmpeg instance terminated."
    );
  }
}