import { GoogleGenAI } from "@google/genai";

// =====================================================
// MODELS
// =====================================================

const TEXT_MODEL = "gemini-3.6-flash";

// =====================================================
// TYPES
// =====================================================

export interface ShortScene {
  time: number;
  visual: string;
  search_query: string;
  onscreen_text: string;
}

export interface GeneratedShort {
  type: "short";
  title: string;
  hook: string;
  voiceover: string;
  scenes: ShortScene[];
  caption: string;
  hashtags: string[];
}

export interface LongScene {
  time: number;
  visual: string;
  search_query: string;
  onscreen_text: string;
}

export interface GeneratedLong {
  type: "long";
  title: string;
  description: string;
  hook: string;
  voiceover: string;
  scenes: LongScene[];
  caption: string;
  hashtags: string[];
}

export type GeneratedContent =
  | GeneratedShort
  | GeneratedLong;

// =====================================================
// HELPERS
// =====================================================

function cleanJsonText(text: string): string {
  let value = text.trim();

  if (value.startsWith("```")) {
    value = value
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  return value;
}

function safeString(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeHashtags(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((item) =>
      item.startsWith("#")
        ? item
        : `#${item.replace(/\s+/g, "")}`
    )
    .slice(0, 12);
}

function normalizeShort(
  raw: any
): GeneratedShort {
  if (!raw || typeof raw !== "object") {
    throw new Error(
      "Gemini returned an invalid Short object."
    );
  }

  if (!safeString(raw.title)) {
    throw new Error(
      "Generated Short is missing a title."
    );
  }

  if (!safeString(raw.voiceover)) {
    throw new Error(
      "Generated Short is missing narration."
    );
  }

  if (!Array.isArray(raw.scenes)) {
    throw new Error(
      "Generated Short is missing scenes."
    );
  }

  const scenes = raw.scenes
    .map((scene: any, index: number) => ({
      time:
        Number(scene.time) > 0
          ? Number(scene.time)
          : 4,
      visual:
        safeString(scene.visual) ||
        `relevant footage for scene ${index + 1}`,
      search_query:
        safeString(scene.search_query) ||
        safeString(scene.visual),
      onscreen_text:
        safeString(scene.onscreen_text),
    }))
    .slice(0, 5);

  while (scenes.length < 5) {
    scenes.push({
      time: 4,
      visual: "relevant stock video footage",
      search_query: "relevant stock video",
      onscreen_text: "",
    });
  }

  return {
    type: "short",
    title: safeString(raw.title),
    hook: safeString(raw.hook),
    voiceover: safeString(raw.voiceover),
    scenes,
    caption:
      safeString(raw.caption) ||
      safeString(raw.title),
    hashtags:
      normalizeHashtags(raw.hashtags),
  };
}

function normalizeLong(
  raw: any
): GeneratedLong {
  if (!raw || typeof raw !== "object") {
    throw new Error(
      "Gemini returned an invalid long-video object."
    );
  }

  if (!safeString(raw.title)) {
    throw new Error(
      "Generated video is missing a title."
    );
  }

  if (!safeString(raw.voiceover)) {
    throw new Error(
      "Generated video is missing narration."
    );
  }

  if (!Array.isArray(raw.scenes)) {
    throw new Error(
      "Generated video is missing visual scenes."
    );
  }

  const scenes = raw.scenes
    .map((scene: any, index: number) => ({
      time:
        Number(scene.time) > 0
          ? Number(scene.time)
          : 12,
      visual:
        safeString(scene.visual) ||
        `documentary footage for scene ${index + 1}`,
      search_query:
        safeString(scene.search_query) ||
        safeString(scene.visual),
      onscreen_text:
        safeString(scene.onscreen_text),
    }))
    .filter(
      (scene: LongScene) =>
        scene.search_query.length > 0
    );

  if (scenes.length === 0) {
    throw new Error(
      "Gemini did not generate usable visual scenes."
    );
  }

  return {
    type: "long",
    title: safeString(raw.title),
    description:
      safeString(raw.description),
    hook: safeString(raw.hook),
    voiceover: safeString(raw.voiceover),
    scenes,
    caption:
      safeString(raw.caption) ||
      safeString(raw.title),
    hashtags:
      normalizeHashtags(raw.hashtags),
  };
}

// =====================================================
// SHORT
// =====================================================

export async function generateShort(
  apiKey: string,
  topic: string,
  language: string,
  style: string,
  voice: string
): Promise<GeneratedShort> {
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing."
    );
  }

  if (!topic.trim()) {
    throw new Error(
      "Please enter a topic."
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const prompt = `
You are an expert YouTube Shorts writer,
director and storyteller.

Create a highly engaging 20-second YouTube Short.

TOPIC:
${topic}

LANGUAGE:
${language}

STYLE:
${style}

VOICE:
${voice}

IMPORTANT:

1. Target approximately 45-60 spoken words.
2. The opening must be an immediate curiosity hook.
3. Do NOT start with "Hey guys".
4. Do NOT start with "Welcome back".
5. Do NOT start with "Today we are going to".
6. The narration must sound spoken, not like an essay.
7. Use short natural sentences.
8. Build curiosity.
9. Include a strong payoff near the end.
10. End memorably.
11. Keep facts accurate.
12. Do not invent statistics.
13. Create exactly 5 visual scenes.
14. Each scene should be approximately 4 seconds.
15. Search queries must describe real footage that could exist on Pexels.
16. Search queries must be concrete.
17. Never use abstract queries like "mystery of time".
18. On-screen text should be short.
19. Caption must be ready for YouTube.
20. Hashtags must be relevant.
21. Return ONLY JSON.

Return:

{
  "title": "YouTube title",
  "hook": "Opening hook",
  "voiceover": "Complete narration",
  "scenes": [
    {
      "time": 4,
      "visual": "Concrete visual description",
      "search_query": "stock video search query",
      "onscreen_text": "Short text"
    }
  ],
  "caption": "Ready-to-post YouTube caption",
  "hashtags": ["#shorts", "#topic"]
}
`;

  try {
    const response =
      await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType:
            "application/json",

          responseSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
              },
              hook: {
                type: "string",
              },
              voiceover: {
                type: "string",
              },
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    time: {
                      type: "number",
                    },
                    visual: {
                      type: "string",
                    },
                    search_query: {
                      type: "string",
                    },
                    onscreen_text: {
                      type: "string",
                    },
                  },
                  required: [
                    "time",
                    "visual",
                    "search_query",
                    "onscreen_text",
                  ],
                },
              },
              caption: {
                type: "string",
              },
              hashtags: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: [
              "title",
              "hook",
              "voiceover",
              "scenes",
              "caption",
              "hashtags",
            ],
          },

          maxOutputTokens: 4096,
        },
      });

    if (!response.text) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    const raw = JSON.parse(
      cleanJsonText(response.text)
    );

    return normalizeShort(raw);
  } catch (error: any) {
    console.error(
      "Gemini Short generation error:",
      error
    );

    throw new Error(
      error?.message ||
        "Failed to generate the Short."
    );
  }
}

// =====================================================
// LONG VIDEO
// =====================================================

export async function generateLong(
  apiKey: string,
  topic: string,
  language: string,
  style: string,
  voice: string,
  targetMinutes: number
): Promise<GeneratedLong> {
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing."
    );
  }

  if (!topic.trim()) {
    throw new Error(
      "Please enter a topic."
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const targetSeconds =
    targetMinutes * 60;

  const estimatedScenes = Math.max(
    15,
    Math.min(
      60,
      Math.ceil(targetSeconds / 12)
    )
  );

  const approximateWords = Math.round(
    targetMinutes * 150
  );

  const prompt = `
You are an expert documentary
writer, researcher and YouTube director.

Create a ${targetMinutes}-minute long-form
YouTube documentary-style video.

TOPIC:
${topic}

LANGUAGE:
${language}

STYLE:
${style}

VOICE:
${voice}

TARGET DURATION:
Approximately ${targetMinutes} minutes.

APPROXIMATE NARRATION:
Around ${approximateWords} spoken words.

IMPORTANT:
Do NOT force the narration to an exact word count.
Natural storytelling is more important than hitting
an exact number.

The final audio may naturally be shorter or longer.

STRUCTURE:

1. Strong cinematic hook.
2. Brief introduction that creates curiosity.
3. Establish context.
4. Develop the story logically.
5. Include important details and turning points.
6. Use emotional variation.
7. Avoid sounding like a textbook.
8. Use natural spoken language.
9. Add pauses naturally through punctuation.
10. Build tension where appropriate.
11. Give the viewer reasons to keep watching.
12. End with a memorable conclusion.
13. Do NOT abruptly stop.
14. Do NOT begin with "Hey guys".
15. Do NOT begin with "Welcome back".
16. Do NOT begin with "Today we are going to".
17. Do not invent facts or statistics.

VISUALS:

Create approximately ${estimatedScenes}
visual beats.

A visual beat should normally cover
around 10-15 seconds.

Every visual must have:
- concrete footage description
- simple Pexels search query
- short optional on-screen text

Search queries must describe real footage.

BAD:
"the feeling of fear"

GOOD:
"crowd walking through dark street"

BAD:
"economic collapse"

GOOD:
"empty factory workers walking"

Do not use abstract search queries.

The visuals should follow the narration
chronologically.

Return ONLY valid JSON.

Return:

{
  "title": "YouTube title",
  "description": "Video description",
  "hook": "Opening hook",
  "voiceover": "Complete narration",
  "scenes": [
    {
      "time": 12,
      "visual": "Concrete visual description",
      "search_query": "Pexels search query",
      "onscreen_text": "Short text"
    }
  ],
  "caption": "Ready-to-post caption",
  "hashtags": [
    "#documentary",
    "#history"
  ]
}
`;

  try {
    const response =
      await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType:
            "application/json",

          responseSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
              },
              description: {
                type: "string",
              },
              hook: {
                type: "string",
              },
              voiceover: {
                type: "string",
              },
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    time: {
                      type: "number",
                    },
                    visual: {
                      type: "string",
                    },
                    search_query: {
                      type: "string",
                    },
                    onscreen_text: {
                      type: "string",
                    },
                  },
                  required: [
                    "time",
                    "visual",
                    "search_query",
                    "onscreen_text",
                  ],
                },
              },
              caption: {
                type: "string",
              },
              hashtags: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: [
              "title",
              "description",
              "hook",
              "voiceover",
              "scenes",
              "caption",
              "hashtags",
            ],
          },

          maxOutputTokens: 20000,
        },
      });

    if (!response.text) {
      throw new Error(
        "Gemini returned an empty long-video response."
      );
    }

    const raw = JSON.parse(
      cleanJsonText(response.text)
    );

    return normalizeLong(raw);
  } catch (error: any) {
    console.error(
      "Gemini long-video error:",
      error
    );

    throw new Error(
      error?.message ||
        "Failed to generate long-form content."
    );
  }
}