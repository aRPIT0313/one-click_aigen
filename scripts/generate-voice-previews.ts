import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// =====================================================
// CONFIG
// =====================================================

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error(
    "ERROR: GEMINI_API_KEY environment variable is missing."
  );
  console.error(
    'PowerShell: $env:GEMINI_API_KEY="YOUR_API_KEY"'
  );
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: API_KEY,
});

// Only the 3 voices that failed previously
const VOICES = [
  "Zephyr",
  "Algieba",
  "Gacrux",
];

const PREVIEW_TEXT = "Hello, how are you?";

const OUTPUT_DIR = path.join(
  process.cwd(),
  "public",
  "voice-previews"
);

// =====================================================
// HELPERS
// =====================================================

function sleep(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

function ensureOutputDirectory() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, {
      recursive: true,
    });
  }
}

function getOutputPath(voice: string) {
  return path.join(
    OUTPUT_DIR,
    `${voice.toLowerCase()}.wav`
  );
}

// =====================================================
// PCM -> WAV
// =====================================================

function pcmToWav(
  pcm: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate =
    sampleRate *
    channels *
    (bitsPerSample / 8);

  const blockAlign =
    channels * (bitsPerSample / 8);

  const dataSize = pcm.length;

  const buffer = Buffer.alloc(
    44 + dataSize
  );

  // RIFF
  buffer.write("RIFF", 0);

  // File size
  buffer.writeUInt32LE(
    36 + dataSize,
    4
  );

  // WAVE
  buffer.write("WAVE", 8);

  // fmt
  buffer.write("fmt ", 12);

  // Subchunk size
  buffer.writeUInt32LE(
    16,
    16
  );

  // Audio format = PCM
  buffer.writeUInt16LE(
    1,
    20
  );

  // Channels
  buffer.writeUInt16LE(
    channels,
    22
  );

  // Sample rate
  buffer.writeUInt32LE(
    sampleRate,
    24
  );

  // Byte rate
  buffer.writeUInt32LE(
    byteRate,
    28
  );

  // Block align
  buffer.writeUInt16LE(
    blockAlign,
    32
  );

  // Bits per sample
  buffer.writeUInt16LE(
    bitsPerSample,
    34
  );

  // data
  buffer.write("data", 36);

  // data size
  buffer.writeUInt32LE(
    dataSize,
    40
  );

  // PCM data
  pcm.copy(
    buffer,
    44
  );

  return buffer;
}

// =====================================================
// GENERATE ONE VOICE
// =====================================================

async function generateVoice(
  voice: string
): Promise<Buffer> {

  console.log(
    `Generating preview for ${voice}...`
  );

  const response =
    await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",

      contents: [
        {
          role: "user",
          parts: [
            {
              text: PREVIEW_TEXT,
            },
          ],
        },
      ],

      config: {
        responseModalities: [
          "AUDIO",
        ],

        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    });

  const parts =
    response.candidates?.[0]
      ?.content?.parts || [];

  for (const part of parts) {

    const inlineData =
      part.inlineData;

    if (
      inlineData?.data
    ) {

      const rawAudio =
        Buffer.from(
          inlineData.data,
          "base64"
        );

      if (
        rawAudio.length === 0
      ) {
        continue;
      }

      // Gemini returns raw PCM.
      const wav =
        pcmToWav(
          rawAudio
        );

      if (
        wav.length === 0
      ) {
        continue;
      }

      return wav;
    }
  }

  throw new Error(
    `No audio returned for ${voice}`
  );
}

// =====================================================
// GENERATE WITH RETRIES
// =====================================================

async function generateWithRetry(
  voice: string,
  maxAttempts = 4
): Promise<Buffer> {

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {

    try {

      console.log(
        `Attempt ${attempt}/${maxAttempts} for ${voice}`
      );

      const audio =
        await generateVoice(
          voice
        );

      if (
        audio.length <= 44
      ) {
        throw new Error(
          "Generated WAV is empty."
        );
      }

      return audio;

    } catch (error: any) {

      const message =
        error?.message ||
        String(error);

      console.error(
        `Attempt ${attempt} failed for ${voice}:`
      );

      console.error(
        message
      );

      // -------------------------------------------------
      // RATE LIMIT
      // -------------------------------------------------

      if (
        error?.status === 429 ||
        message.includes("429") ||
        message.includes(
          "RESOURCE_EXHAUSTED"
        ) ||
        message.includes(
          "quota"
        )
      ) {

        const waitTime =
          20000 + attempt * 5000;

        console.log(
          `Rate limit detected. Waiting ${
            Math.round(waitTime / 1000)
          } seconds...`
        );

        await sleep(
          waitTime
        );

        continue;
      }

      // -------------------------------------------------
      // NO AUDIO / TEMPORARY ERROR
      // -------------------------------------------------

      if (
        message.includes(
          "No audio returned"
        )
      ) {

        const waitTime =
          5000 + attempt * 3000;

        console.log(
          `No audio returned. Waiting ${
            Math.round(waitTime / 1000)
          } seconds before retry...`
        );

        await sleep(
          waitTime
        );

        continue;
      }

      // -------------------------------------------------
      // OTHER ERROR
      // -------------------------------------------------

      if (
        attempt < maxAttempts
      ) {

        const waitTime =
          5000 + attempt * 2000;

        console.log(
          `Waiting ${
            Math.round(waitTime / 1000)
          } seconds before retry...`
        );

        await sleep(
          waitTime
        );

      }
    }
  }

  throw new Error(
    `Failed to generate ${voice} after ${maxAttempts} attempts.`
  );
}

// =====================================================
// MAIN
// =====================================================

async function main() {

  console.log(
    "========================================"
  );

  console.log(
    "GENERATING REMAINING VOICE PREVIEWS"
  );

  console.log(
    "========================================"
  );

  ensureOutputDirectory();

  console.log(
    `Output directory: ${OUTPUT_DIR}`
  );

  console.log("");

  for (
    let i = 0;
    i < VOICES.length;
    i++
  ) {

    const voice =
      VOICES[i];

    const outputPath =
      getOutputPath(
        voice
      );

    // -------------------------------------------------
    // SAFETY CHECK
    // -------------------------------------------------

    if (
      fs.existsSync(
        outputPath
      )
    ) {

      const stats =
        fs.statSync(
          outputPath
        );

      if (
        stats.size > 44
      ) {

        console.log(
          `✓ ${voice} already exists (${stats.size} bytes) - SKIPPING`
        );

        continue;
      }

      // Remove broken/empty file
      fs.unlinkSync(
        outputPath
      );
    }

    console.log("");

    try {

      const audio =
        await generateWithRetry(
          voice
        );

      fs.writeFileSync(
        outputPath,
        audio
      );

      const size =
        fs.statSync(
          outputPath
        ).size;

      if (
        size <= 44
      ) {

        fs.unlinkSync(
          outputPath
        );

        throw new Error(
          "Generated file is empty."
        );
      }

      console.log(
        `✓ ${voice.toLowerCase()}.wav (${size} bytes)`
      );

    } catch (error: any) {

      console.error(
        `✗ Failed: ${voice}`
      );

      console.error(
        error?.message ||
        error
      );
    }

    // -------------------------------------------------
    // WAIT BEFORE NEXT VOICE
    // -------------------------------------------------

    if (
      i <
      VOICES.length - 1
    ) {

      console.log(
        "Waiting 20 seconds before next voice..."
      );

      await sleep(
        20000
      );
    }
  }

  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "VOICE PREVIEW GENERATION FINISHED"
  );

  console.log(
    "========================================"
  );

  // -------------------------------------------------
  // FINAL STATUS
  // -------------------------------------------------

  console.log("");

  for (
    const voice of VOICES
  ) {

    const outputPath =
      getOutputPath(
        voice
      );

    if (
      fs.existsSync(
        outputPath
      )
    ) {

      const size =
        fs.statSync(
          outputPath
        ).size;

      console.log(
        `✓ ${voice}: ${size} bytes`
      );

    } else {

      console.log(
        `✗ ${voice}: MISSING`
      );
    }
  }

  console.log("");
}

main().catch(
  (error) => {

    console.error(
      "FATAL ERROR:"
    );

    console.error(
      error
    );

    process.exit(1);
  }
);