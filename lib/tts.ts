import { GoogleGenAI } from "@google/genai";

// =====================================================
// MODEL
// =====================================================

const TTS_MODEL =
  "gemini-3.1-flash-tts-preview";

// =====================================================
// BASE64
// =====================================================

function base64ToUint8Array(
  base64: string
): Uint8Array {
  const binary =
    atob(base64);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
}

// =====================================================
// WAV
// =====================================================

function pcmToWav(
  pcmData: Uint8Array,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): Uint8Array {
  const bytesPerSample =
    bitsPerSample / 8;

  const blockAlign =
    channels *
    bytesPerSample;

  const byteRate =
    sampleRate *
    blockAlign;

  const dataSize =
    pcmData.length;

  const buffer =
    new ArrayBuffer(
      44 + dataSize
    );

  const view =
    new DataView(buffer);

  writeString(
    view,
    0,
    "RIFF"
  );

  view.setUint32(
    4,
    36 + dataSize,
    true
  );

  writeString(
    view,
    8,
    "WAVE"
  );

  writeString(
    view,
    12,
    "fmt "
  );

  view.setUint32(
    16,
    16,
    true
  );

  view.setUint16(
    20,
    1,
    true
  );

  view.setUint16(
    22,
    channels,
    true
  );

  view.setUint32(
    24,
    sampleRate,
    true
  );

  view.setUint32(
    28,
    byteRate,
    true
  );

  view.setUint16(
    32,
    blockAlign,
    true
  );

  view.setUint16(
    34,
    bitsPerSample,
    true
  );

  writeString(
    view,
    36,
    "data"
  );

  view.setUint32(
    40,
    dataSize,
    true
  );

  new Uint8Array(
    buffer,
    44
  ).set(pcmData);

  return new Uint8Array(
    buffer
  );
}

function writeString(
  view: DataView,
  offset: number,
  value: string
) {
  for (
    let i = 0;
    i < value.length;
    i++
  ) {
    view.setUint8(
      offset + i,
      value.charCodeAt(i)
    );
  }
}

// =====================================================
// WAV PCM EXTRACTION
// =====================================================

function wavToPcm(
  wav: Uint8Array
): Uint8Array {
  if (
    wav.length < 44
  ) {
    throw new Error(
      "Invalid WAV data."
    );
  }

  return wav.slice(44);
}

// =====================================================
// LANGUAGE
// =====================================================

function getLanguageCode(
  language?: string
): string | undefined {
  switch (language) {
    case "Hindi":
      return "hi-IN";

    case "Hinglish":
      return "en-IN";

    case "English":
      return "en-US";

    default:
      return undefined;
  }
}

// =====================================================
// STYLE DIRECTOR
// =====================================================

function getDirectorStyle(
  style: string
): string {
  switch (style) {
    case "Documentary":
      return `
Serious cinematic documentary narrator.
Calm authority.
Natural pauses.
Build tension gradually.
Emphasize important revelations.
`;

    case "Mysterious":
      return `
Mysterious investigative narrator.
Quiet curiosity.
Slow down before important reveals.
Use suspenseful pauses.
`;

    case "Dramatic":
      return `
Emotionally powerful documentary narrator.
Strong contrast between calm and intense moments.
Use deliberate pauses.
Emphasize emotional words.
`;

    case "Funny":
      return `
Playful energetic narrator.
Natural conversational delivery.
Light humor.
Do not sound robotic.
`;

    case "News-style":
      return `
Confident news/documentary narrator.
Clear articulation.
Controlled urgency.
Professional tone.
`;

    case "Cinematic":
      return `
Cinematic storyteller.
Deep emotional variation.
Slow dramatic moments.
Strong emphasis on key lines.
`;

    case "Storytelling":
      return `
Warm storyteller.
Conversational.
Emotionally expressive.
Build suspense and curiosity.
`;

    case "Educational":
      return `
Clear expert narrator.
Friendly and engaging.
Emphasize important concepts.
Avoid sounding like a textbook.
`;

    default:
      return `
Natural engaging narrator.
Conversational and expressive.
`;
  }
}

// =====================================================
// CHUNK TEXT
// =====================================================

function splitText(
  text: string,
  maxCharacters = 4200
): string[] {
  const cleaned =
    text.trim();

  if (
    cleaned.length <=
    maxCharacters
  ) {
    return [cleaned];
  }

  const paragraphs =
    cleaned.split(
      /\n\s*\n/
    );

  const chunks: string[] = [];
  let current = "";

  for (
    const paragraph of paragraphs
  ) {
    if (
      paragraph.length >
      maxCharacters
    ) {
      const sentences =
        paragraph.split(
          /(?<=[.!?])\s+/
        );

      for (
        const sentence of sentences
      ) {
        if (
          current.length +
            sentence.length +
            1 >
          maxCharacters
        ) {
          if (
            current.trim()
          ) {
            chunks.push(
              current.trim()
            );
          }

          current =
            sentence;
        } else {
          current +=
            " " +
            sentence;
        }
      }

      continue;
    }

    if (
      current.length +
        paragraph.length +
        2 >
      maxCharacters
    ) {
      if (
        current.trim()
      ) {
        chunks.push(
          current.trim()
        );
      }

      current =
        paragraph;
    } else {
      current +=
        (current
          ? "\n\n"
          : "") +
        paragraph;
    }
  }

  if (current.trim()) {
    chunks.push(
      current.trim()
    );
  }

  return chunks;
}

// =====================================================
// ONE TTS REQUEST
// =====================================================

async function generateChunk(
  ai: GoogleGenAI,
  text: string,
  voice: string,
  language: string,
  style: string
): Promise<Uint8Array> {
  const languageCode =
    getLanguageCode(
      language
    );

  const director =
    getDirectorStyle(
      style
    );

  const prompt = `
You are a professional voice actor
performing narration for a YouTube video.

DIRECTOR NOTES:
${director}

LANGUAGE:
${language}

VOICE:
${voice}

PERFORMANCE:
- Do not sound like you are reading a book.
- Speak naturally.
- Vary pacing.
- Use emotional emphasis.
- Use short pauses around important ideas.
- Sound human and confident.
- Match the emotional tone of the words.
- Never read the director notes aloud.

Use expressive delivery tags where helpful,
such as:
[serious]
[curious]
[excited]
[whispers]
[dramatic pause]
[amazed]
[somber]

SYNTHESIZE ONLY THE FOLLOWING NARRATION:

${text}
`;

  let lastError: any = null;

  for (
    let attempt = 0;
    attempt < 3;
    attempt++
  ) {
    try {
      const response =
        await ai.models.generateContent({
          model: TTS_MODEL,

          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
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
                  voiceName:
                    voice,
                },
              },

              ...(languageCode
                ? {
                    languageCode,
                  }
                : {}),
            },
          },
        });

      const base64Audio =
        response
          .candidates?.[0]
          ?.content?.parts?.find(
            (part: any) =>
              part.inlineData?.data
          )
          ?.inlineData?.data;

      if (!base64Audio) {
        throw new Error(
          "Gemini TTS returned no audio."
        );
      }

      return pcmToWav(
        base64ToUint8Array(
          base64Audio
        )
      );
    } catch (error: any) {
      lastError = error;

      const message =
        String(
          error?.message || ""
        );

      if (
        message.includes(
          "429"
        )
      ) {
        throw new Error(
          "Gemini TTS quota/rate limit reached. Please wait or use another Gemini API key."
        );
      }

      if (
        attempt < 2
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              1000 *
                Math.pow(
                  2,
                  attempt
                )
            )
        );
      }
    }
  }

  throw new Error(
    lastError?.message ||
      "Voice generation failed."
  );
}

// =====================================================
// PUBLIC FUNCTION
// =====================================================

export async function generateVoice(
  apiKey: string,
  text: string,
  voice: string,
  language?: string,
  style = "Documentary"
): Promise<Uint8Array> {
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing."
    );
  }

  if (!text?.trim()) {
    throw new Error(
      "Voiceover text is empty."
    );
  }

  const ai =
    new GoogleGenAI({
      apiKey,
    });

  const chunks =
    splitText(
      text,
      4200
    );

  const wavChunks:
    Uint8Array[] = [];

  for (
    const chunk of chunks
  ) {
    const wav =
      await generateChunk(
        ai,
        chunk,
        voice,
        language || "English",
        style
      );

    wavChunks.push(wav);
  }

  if (
    wavChunks.length === 1
  ) {
    return wavChunks[0];
  }

  // Combine PCM from all WAVs.
  let totalLength = 0;

  for (
    const wav of wavChunks
  ) {
    totalLength +=
      wav.length - 44;
  }

  const pcm =
    new Uint8Array(
      totalLength
    );

  let offset = 0;

  for (
    const wav of wavChunks
  ) {
    const chunk =
      wavToPcm(wav);

    pcm.set(
      chunk,
      offset
    );

    offset +=
      chunk.length;
  }

  return pcmToWav(
    pcm
  );
}