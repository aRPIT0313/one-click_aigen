"use client";
import { useEffect, useState } from "react";

import {
  generateShort,
  GeneratedShort,
} from "@/lib/gemini";

import {
  searchPexelsVideo,
  PexelsVideo,
} from "@/lib/pexels";

import {
  generateVoice,
} from "@/lib/tts";

import {
  renderShort,
} from "@/lib/renderer";


// =====================================================
// OPTIONS
// =====================================================

const languages = [
  "English",
  "Hindi",
  "Hinglish",
];

const styles = [
  "Documentary",
  "Educational",
  "Mysterious",
  "Funny",
  "Dramatic",
  "Storytelling",
  "News-style",
  "Cinematic",
];

const voices = [
  "Kore",
  "Puck",
  "Charon",
  "Zephyr",
  "Fenrir",
  "Leda",
  "Aoede",
  "Iapetus",
  "Algieba",
  "Gacrux",
];


// =====================================================
// ICON COMPONENTS
// =====================================================

function SparklesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="m12 3-1.2 4.1L7 8.5l3.8 1.4L12 14l1.2-4.1L17 8.5l-3.8-1.4L12 3Z" />
      <path d="m19 13-.7 2.3-2.3.7.2.7 2.3-.7.7-2.3.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
      <path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3.1 1.3v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3.1-1.3l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1A1.8 1.8 0 0 0 3.3 12h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 1.3-3.1l-.1-.1A1.8 1.8 0 1 1 7 2.7l.1.1a1.8 1.8 0 0 0 3.1-1.3v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3.1 1.3l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3.1h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-1.3 3.1Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M8 5.1v13.8c0 .8.9 1.3 1.6.9l10.5-6.9c.6-.4.6-1.3 0-1.7L9.6 4.2C8.9 3.8 8 4.3 8 5.1Z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect x="3" y="5" width="13" height="14" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}


// =====================================================
// AUDIO BLOB HELPER
// =====================================================

function bytesToBlob(
  bytes: Uint8Array,
  type: string
): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  return new Blob(
    [copy.buffer],
    { type }
  );
}


// =====================================================
// PAGE
// =====================================================

export default function Home() {

  // ===================================================
  // SEO STRUCTURED DATA
  // ===================================================

  const siteUrl =
    "https://one-click-aigen.vercel.app";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",

    name: "AI Shorts",

    alternateName:
      "One Click AI Gen",

    url: siteUrl,

    description:
      "Free AI video generator for creating short-form videos with AI scripts, voiceovers, stock footage and automatic 9:16 video rendering.",

    applicationCategory:
      "MultimediaApplication",

    operatingSystem:
      "Web",

    browserRequirements:
      "Requires JavaScript",

    isAccessibleForFree:
      true,

    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },

    featureList: [
      "AI short video generation",
      "AI script generation",
      "AI voiceover generation",
      "Stock video search",
      "Automatic video rendering",
      "Vertical 9:16 video generation",
      "YouTube Shorts creation",
      "Instagram Reels creation",
      "TikTok video creation",
    ],
  };


  // ===================================================
  // INPUTS
  // ===================================================

  const [topic, setTopic] =
    useState("");

  const [language, setLanguage] =
    useState("English");

  const [style, setStyle] =
    useState("Documentary");

  const [voice, setVoice] =
    useState("Kore");


  // ===================================================
  // API
  // ===================================================

  const [geminiKey, setGeminiKey] =
    useState("");

  const [pexelsKey, setPexelsKey] =
    useState("");

  const [showSettings, setShowSettings] =
    useState(false);


  // ===================================================
  // STATES
  // ===================================================

  const [generating, setGenerating] =
    useState(false);

  const [generatingVoice, setGeneratingVoice] =
    useState(false);

  const [searchingVideos, setSearchingVideos] =
    useState(false);

  const [rendering, setRendering] =
    useState(false);

  const [renderProgress, setRenderProgress] =
    useState(0);


  // ===================================================
  // RESULTS
  // ===================================================

  const [result, setResult] =
    useState<GeneratedShort | null>(null);

  const [videos, setVideos] =
    useState<(PexelsVideo | null)[]>([]);

  const [audioData, setAudioData] =
    useState<Uint8Array | null>(null);

  const [audioUrl, setAudioUrl] =
    useState<string | null>(null);

  const [finalVideoUrl, setFinalVideoUrl] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");


  // ===================================================
  // LOAD KEYS
  // ===================================================

  useEffect(() => {

    try {

      const gemini =
        localStorage.getItem(
          "gemini_api_key"
        );

      const pexels =
        localStorage.getItem(
          "pexels_api_key"
        );

      if (gemini) {
        setGeminiKey(gemini);
      }

      if (pexels) {
        setPexelsKey(pexels);
      }

    } catch (err) {

      console.error(err);

    }

  }, []);


  // ===================================================
  // CLEAN URLS
  // ===================================================

  useEffect(() => {

    return () => {

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      if (finalVideoUrl) {
        URL.revokeObjectURL(finalVideoUrl);
      }

    };

  }, [
    audioUrl,
    finalVideoUrl,
  ]);


  const keysMissing =
    !geminiKey || !pexelsKey;


  // ===================================================
  // SAVE SETTINGS
  // ===================================================

  const saveSettings = () => {

    try {

      const gemini =
        geminiKey.trim();

      const pexels =
        pexelsKey.trim();

      if (gemini) {

        localStorage.setItem(
          "gemini_api_key",
          gemini
        );

      } else {

        localStorage.removeItem(
          "gemini_api_key"
        );

      }

      if (pexels) {

        localStorage.setItem(
          "pexels_api_key",
          pexels
        );

      } else {

        localStorage.removeItem(
          "pexels_api_key"
        );

      }

      setGeminiKey(gemini);
      setPexelsKey(pexels);

      setShowSettings(false);

    } catch {

      setError(
        "Could not save API settings."
      );

    }

  };


  // ===================================================
  // REMOVE KEYS
  // ===================================================

  const removeKeys = () => {

    localStorage.removeItem(
      "gemini_api_key"
    );

    localStorage.removeItem(
      "pexels_api_key"
    );

    setGeminiKey("");
    setPexelsKey("");

  };


  // ===================================================
  // VOICE PREVIEW
  // ===================================================

  const [previewingVoice, setPreviewingVoice] =
  useState(false);

const previewVoice = () => {
  if (typeof window === "undefined") {
    return;
  }

  const voiceFile =
    `/voice-previews/${voice.toLowerCase()}.wav`;

  const audio =
    new Audio(voiceFile);

  audio.preload = "auto";

  setPreviewingVoice(true);

  audio.onended = () => {
    setPreviewingVoice(false);
  };

  audio.onerror = () => {
    setPreviewingVoice(false);

    setError(
      `Could not load the ${voice} voice preview.`
    );
  };

  audio.play().catch((error) => {
    console.error(error);

    setPreviewingVoice(false);

    setError(
      "Could not play the voice preview."
    );
  });
};

  // ===================================================
  // CREATE VOICE
  // ===================================================

  const createVoice = async (
    generatedResult?: GeneratedShort
  ) => {

    const currentResult =
      generatedResult || result;

    if (!currentResult) {

      setError(
        "Generate the script first."
      );

      return;
    }

    if (!geminiKey) {

      setShowSettings(true);

      setError(
        "Add your Gemini API key first."
      );

      return;
    }

    setGeneratingVoice(true);
    setError("");

    try {

      const audio =
        await generateVoice(
          geminiKey,
          currentResult.voiceover,
          voice,
          language
        );

      setAudioData(audio);

      if (audioUrl) {

        URL.revokeObjectURL(
          audioUrl
        );

      }

      const blob =
        bytesToBlob(
          audio,
          "audio/wav"
        );

      setAudioUrl(
        URL.createObjectURL(
          blob
        )
      );

    } catch (err: any) {

      console.error(err);

      setError(
        err?.message ||
        "Voice generation failed."
      );

    } finally {

      setGeneratingVoice(false);

    }

  };


  // ===================================================
  // FIND VIDEOS
  // ===================================================

  const findVideos = async (
    generated: GeneratedShort
  ) => {

    if (!pexelsKey) {

      setShowSettings(true);

      setError(
        "Add your Pexels API key first."
      );

      return;
    }

    setSearchingVideos(true);
    setError("");

    try {

      const found:
        (PexelsVideo | null)[] = [];

      for (
        const scene of generated.scenes
      ) {

        const query =
          scene.visual
            .replace(
              /[^\w\s]/gi,
              ""
            )
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 8)
            .join(" ");

        const video =
          await searchPexelsVideo(
            pexelsKey,
            query
          );

        found.push(video);

      }

      setVideos(found);

    } catch (err: any) {

      console.error(err);

      setError(
        err?.message ||
        "Failed to find stock videos."
      );

    } finally {

      setSearchingVideos(false);

    }

  };


  // ===================================================
  // CREATE SHORT
  // ===================================================

  const handleGenerate = async () => {

    setError("");

    if (!topic.trim()) {

      setError(
        "Tell us what your Short should be about."
      );

      return;
    }

    if (!geminiKey) {

      setShowSettings(true);

      setError(
        "Add your Gemini API key first."
      );

      return;
    }

    if (!pexelsKey) {

      setShowSettings(true);

      setError(
        "Add your Pexels API key first."
      );

      return;
    }

    setGenerating(true);

    setResult(null);
    setVideos([]);
    setAudioData(null);

    if (audioUrl) {

      URL.revokeObjectURL(
        audioUrl
      );

    }

    setAudioUrl(null);

    if (finalVideoUrl) {

      URL.revokeObjectURL(
        finalVideoUrl
      );

    }

    setFinalVideoUrl(null);

    try {

      const generated =
        await generateShort(
          geminiKey,
          topic,
          language,
          style,
          voice
        );

      setResult(generated);


      // -----------------------------------------------
      // VOICE
      // -----------------------------------------------

      setGeneratingVoice(true);

      const audio =
        await generateVoice(
          geminiKey,
          generated.voiceover,
          voice,
          language
        );

      setAudioData(audio);

      const audioBlob =
        bytesToBlob(
          audio,
          "audio/wav"
        );

      setAudioUrl(
        URL.createObjectURL(
          audioBlob
        )
      );

      setGeneratingVoice(false);


      // -----------------------------------------------
      // VIDEOS
      // -----------------------------------------------

      await findVideos(
        generated
      );

    } catch (err: any) {

      console.error(err);

      setError(
        err?.message ||
        "Something went wrong while creating your Short."
      );

    } finally {

      setGenerating(false);
      setGeneratingVoice(false);

    }

  };


  // ===================================================
  // FINAL VIDEO
  // ===================================================

  const createFinalVideo = async () => {

    if (!result) {

      setError(
        "Generate the Short first."
      );

      return;
    }

    if (!audioData) {

      setError(
        "Voice is not ready yet."
      );

      return;
    }

    if (
      !videos.length ||
      videos.length !==
        result.scenes.length
    ) {

      setError(
        "Some stock footage is missing."
      );

      return;
    }

    if (
      videos.some(
        (video) =>
          !video?.videoFile
      )
    ) {

      setError(
        "One or more scenes don't have usable footage."
      );

      return;
    }

    setRendering(true);
    setRenderProgress(0);
    setError("");

    try {

      const clipUrls =
        videos.map(
          (video) =>
            video!.videoFile
        );

      const output =
        await renderShort({

          clips:
            clipUrls,

          voice:
            audioData,

          scenes:
            result.scenes,

          onProgress:
            setRenderProgress,

        });

      if (finalVideoUrl) {

        URL.revokeObjectURL(
          finalVideoUrl
        );

      }

      setFinalVideoUrl(
        URL.createObjectURL(
          output
        )
      );

      setRenderProgress(
        100
      );

    } catch (err: any) {

      console.error(err);

      setError(
        err?.message ||
        "Video rendering failed."
      );

    } finally {

      setRendering(false);

    }

  };


  // ===================================================
  // UI
  // ===================================================

  return (

    <main
      className="min-h-screen overflow-hidden bg-[#07070a] text-white"
      itemScope
      itemType="https://schema.org/WebApplication"
    >

      {/* =================================================
          SEO STRUCTURED DATA
      ================================================= */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              structuredData
            ),
        }}
      />


      {/* =================================================
          AMBIENT BACKGROUND
      ================================================= */}

      <div className="pointer-events-none fixed inset-0 -z-10">

        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[140px]" />

        <div className="absolute right-[-200px] top-[35%] h-[400px] w-[400px] rounded-full bg-blue-600/5 blur-[120px]" />

        <div className="absolute bottom-[-200px] left-[-100px] h-[400px] w-[400px] rounded-full bg-purple-600/5 blur-[120px]" />

      </div>


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07070a]/80 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-white to-gray-300 text-black shadow-lg shadow-white/10">

              <SparklesIcon />

            </div>

            <div>

              <div className="text-sm font-semibold tracking-tight">

                AI Shorts

              </div>

              <div className="hidden text-[10px] text-gray-600 sm:block">

                CREATE • EDIT • PUBLISH

              </div>

            </div>

          </div>


          <button

            onClick={() =>
              setShowSettings(true)
            }

            className={`
              group relative flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all
              ${
                keysMissing
                  ? "animate-pulse border-yellow-400/30 bg-yellow-400/[0.07] text-yellow-300 hover:bg-yellow-400/10"
                  : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              }
            `}

          >

            <SettingsIcon />

            <span className="hidden sm:inline">
              API Settings
            </span>

            {keysMissing && (

              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,.7)]" />

            )}

          </button>

        </div>

      </header>


      {/* =================================================
          HERO
      ================================================= */}

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-16 sm:px-6 sm:pt-24">

        <div className="mx-auto max-w-3xl text-center">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-1.5 text-[11px] text-gray-400 shadow-xl shadow-black/20">

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.8)]" />

            FREE AI VIDEO CREATION

          </div>


          {/* =================================================
              SEO PRIMARY HEADING
          ================================================= */}

          <h1
            className="text-4xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-7xl"
            itemProp="name"
          >

            Free AI Video Generator for

            <span className="block bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">

              YouTube Shorts & Reels

            </span>

          </h1>


          {/* =================================================
              SEO HERO DESCRIPTION
          ================================================= */}

          <p
            className="mx-auto mt-6 max-w-xl text-sm leading-6 text-gray-500 sm:text-base"
            itemProp="description"
          >

            Create short-form videos with our free AI video
            generator. Generate an AI script, voiceover, stock
            footage and a finished 9:16 video for YouTube Shorts,
            Instagram Reels and TikTok — directly in your browser.

          </p>


          {/* MINI FLOW */}

          <div className="mx-auto mt-9 flex max-w-lg items-center justify-center gap-2 text-[10px] text-gray-600 sm:gap-3 sm:text-xs">

            <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5">

              Script

            </span>

            <span>→</span>

            <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5">

              Voice

            </span>

            <span>→</span>

            <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5">

              Footage

            </span>

            <span>→</span>

            <span className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5">

              MP4

            </span>

          </div>

        </div>


        {/* =================================================
            MAIN GENERATOR CARD
        ================================================= */}

        <div className="mx-auto mt-12 max-w-2xl">

          <div className="relative rounded-3xl border border-white/[0.09] bg-white/[0.035] p-1 shadow-2xl shadow-black/30">

            <div className="rounded-[22px] bg-[#0c0c10]/95 p-5 sm:p-7">


              {/* CARD HEADER */}

              <div className="mb-7 flex items-center justify-between">

                <div>

                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-600">

                    Create

                  </p>

                  <h2 className="mt-1 text-lg font-semibold">

                    Your next Short

                  </h2>

                </div>


                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-gray-500">

                  ~20 SEC

                </div>

              </div>


              {/* TOPIC */}

              <div>

                <label className="mb-2.5 block text-xs font-medium text-gray-400">

                  What should we create?

                </label>


                <div className="relative">

                  <textarea

                    value={topic}

                    onChange={(e) =>
                      setTopic(
                        e.target.value
                      )
                    }

                    placeholder="e.g. Why does the Sun look yellow?"

                    rows={4}

                    maxLength={500}

                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-gray-700 focus:border-violet-400/30 focus:bg-black/30"

                  />

                  <div className="absolute bottom-3 right-3 text-[10px] text-gray-700">

                    {topic.length}/500

                  </div>

                </div>

              </div>


              {/* OPTIONS */}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-[11px] text-gray-500">

                    LANGUAGE

                  </label>

                  <select

                    value={language}

                    onChange={(e) =>
                      setLanguage(
                        e.target.value
                      )
                    }

                    className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-gray-200 outline-none transition focus:border-white/20"

                  >

                    {languages.map(
                      (item) => (

                        <option
                          key={item}
                          value={item}
                          className="bg-[#111114]"
                        >

                          {item}

                        </option>

                      )
                    )}

                  </select>

                </div>


                <div>

                  <label className="mb-2 block text-[11px] text-gray-500">

                    STYLE

                  </label>

                  <select

                    value={style}

                    onChange={(e) =>
                      setStyle(
                        e.target.value
                      )
                    }

                    className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-gray-200 outline-none transition focus:border-white/20"

                  >

                    {styles.map(
                      (item) => (

                        <option
                          key={item}
                          value={item}
                          className="bg-[#111114]"
                        >

                          {item}

                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* VOICE */}

              <div className="mt-5">

                <label className="mb-2 block text-[11px] text-gray-500">

                  VOICE

                </label>


                <div className="flex gap-2">

                  <select

                    value={voice}

                    onChange={(e) =>
                      setVoice(
                        e.target.value
                      )
                    }

                    className="min-w-0 flex-1 appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-gray-200 outline-none focus:border-white/20"

                  >

                    {voices.map(
                      (item) => (

                        <option
                          key={item}
                          value={item}
                          className="bg-[#111114]"
                        >

                          {item}

                        </option>

                      )
                    )}

                  </select>


                  <button
  type="button"
  onClick={previewVoice}
  disabled={previewingVoice}
  className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs text-gray-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
>
  {previewingVoice ? (
    <>
      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/20 border-t-white" />
      Playing
    </>
  ) : (
    <>
      <PlayIcon />
      Preview
    </>
  )}
</button>

                </div>


                <p className="mt-2 text-[10px] text-gray-700">

                  Preview uses your browser.
                  Final narration uses Gemini.

                </p>

              </div>


              {/* API STATUS */}

              <div className="mt-6 rounded-2xl border border-white/[0.07] bg-black/20 p-4">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-medium text-gray-300">

                      API connection

                    </p>

                    <p className="mt-1 text-[10px] text-gray-600">

                      Keys stay on this device.

                    </p>

                  </div>


                  <button

                    onClick={() =>
                      setShowSettings(
                        true
                      )
                    }

                    className="text-[11px] text-gray-500 transition hover:text-white"

                  >

                    Configure →

                  </button>

                </div>


                <div className="mt-3 flex gap-2">

                  <div className="flex flex-1 items-center gap-2 rounded-lg bg-white/[0.025] px-3 py-2.5">

                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        geminiKey
                          ? "bg-emerald-400"
                          : "bg-yellow-400"
                      }`}
                    />

                    <span className="text-[10px] text-gray-500">

                      Gemini

                    </span>

                  </div>


                  <div className="flex flex-1 items-center gap-2 rounded-lg bg-white/[0.025] px-3 py-2.5">

                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        pexelsKey
                          ? "bg-emerald-400"
                          : "bg-yellow-400"
                      }`}
                    />

                    <span className="text-[10px] text-gray-500">

                      Pexels

                    </span>

                  </div>

                </div>

              </div>


              {/* CREATE BUTTON */}

              <button

                onClick={
                  handleGenerate
                }

                disabled={
                  generating ||
                  !topic.trim()
                }

                className="group relative mt-5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-5 py-4 text-sm font-semibold text-black shadow-xl shadow-white/[0.04] transition-all hover:bg-gray-100 hover:shadow-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"

              >

                <span className="relative z-10 flex items-center gap-2">

                  {generating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon />
                      Create 20-Second Short
                    </>
                  )}

                </span>

              </button>

            </div>

          </div>

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="mx-auto mt-5 max-w-2xl">

            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-xs text-red-300">

              {error}

            </div>

          </div>

        )}


        {/* =================================================
            RESULT
        ================================================= */}

        {result && (

          <div className="mx-auto mt-10 max-w-2xl space-y-5">


            {/* RESULT HEADER */}

            <div className="flex items-end justify-between px-1">

              <div>

                <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-500">

                  Generated

                </p>

                <h2 className="mt-1 text-xl font-semibold">

                  Your Short

                </h2>

              </div>


              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                Ready

              </span>

            </div>


            {/* TITLE / HOOK */}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

              <h3 className="text-xl font-semibold leading-7">

                {result.title}

              </h3>


              <div className="mt-5 rounded-xl border border-yellow-400/10 bg-yellow-400/[0.035] p-4">

                <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-yellow-500">

                  🎣 Hook

                </div>

                <p className="text-sm leading-6 text-gray-300">

                  {result.hook}

                </p>

              </div>

            </div>


            {/* VOICEOVER */}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <p className="text-[10px] uppercase tracking-wider text-gray-600">

                    Narration

                  </p>

                  <h3 className="mt-1 text-sm font-medium">

                    Voiceover script

                  </h3>

                </div>

                <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] text-gray-600">

                  {voice}

                </span>

              </div>


              <p className="text-sm leading-7 text-gray-400">

                {result.voiceover}

              </p>


              <div className="mt-5 border-t border-white/[0.06] pt-4">

                {audioUrl ? (

                  <>

                    <audio

                      controls

                      preload="metadata"

                      src={audioUrl}

                      className="h-10 w-full"

                    />

                    <a

                      href={audioUrl}

                      download="short_voice.wav"

                      className="mt-3 flex items-center justify-center gap-2 text-[10px] text-gray-600 hover:text-white"

                    >

                      <DownloadIcon />

                      Download narration

                    </a>

                  </>

                ) : (

                  <button

                    onClick={() =>
                      createVoice()
                    }

                    disabled={
                      generatingVoice
                    }

                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs transition hover:bg-white/[0.06] disabled:opacity-50"

                  >

                    {generatingVoice ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/20 border-t-white" />
                        Generating voice...
                      </>
                    ) : (
                      <>
                        <PlayIcon />
                        Generate voice
                      </>
                    )}

                  </button>
                )}

              </div>

            </div>


            {/* SCENES */}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <p className="text-[10px] uppercase tracking-wider text-gray-600">

                    Storyboard

                  </p>

                  <h3 className="mt-1 text-sm font-medium">

                    Scene breakdown

                  </h3>

                </div>


                <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] text-gray-600">

                  {result.scenes.length} scenes

                </span>

              </div>


              <div className="space-y-3">

                {result.scenes.map(
                  (scene, index) => (

                    <div
                      key={index}
                      className="group rounded-xl border border-white/[0.06] bg-black/20 p-4 transition hover:border-white/10"
                    >

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-2">

                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] text-[10px] font-semibold text-gray-400">

                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}

                          </span>

                          <span className="text-xs font-medium">

                            Scene {index + 1}

                          </span>

                        </div>


                        <span className="text-[10px] text-gray-600">

                          {scene.time}s

                        </span>

                      </div>


                      <div className="mt-4 grid gap-4 sm:grid-cols-2">

                        <div>

                          <p className="text-[9px] uppercase tracking-wider text-gray-700">

                            Visual

                          </p>

                          <p className="mt-1.5 text-xs leading-5 text-gray-500">

                            {scene.visual}

                          </p>

                        </div>


                        <div>

                          <p className="text-[9px] uppercase tracking-wider text-gray-700">

                            On-screen text

                          </p>

                          <p className="mt-1.5 text-xs leading-5 text-gray-300">

                            {scene.onscreen_text}

                          </p>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* CAPTION / TAGS */}

            <div className="grid gap-5 sm:grid-cols-2">

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

                <p className="text-[10px] uppercase tracking-wider text-gray-600">

                  Caption

                </p>

                <p className="mt-3 text-xs leading-6 text-gray-500">

                  {result.caption}

                </p>

              </div>


              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

                <p className="text-[10px] uppercase tracking-wider text-gray-600">

                  Hashtags

                </p>

                <p className="mt-3 text-xs leading-6 text-gray-500">

                  {result.hashtags.join(" ")}

                </p>

              </div>

            </div>


            {/* =================================================
                STOCK FOOTAGE
            ================================================= */}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <p className="text-[10px] uppercase tracking-wider text-gray-600">

                    Footage

                  </p>

                  <h3 className="mt-1 text-sm font-medium">

                    Stock video

                  </h3>

                </div>


                {!searchingVideos &&
                  videos.length > 0 && (

                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">

                      <CheckIcon />

                      Matched

                    </span>

                  )}

              </div>


              {searchingVideos && (

                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-8 text-center">

                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white" />

                  <p className="mt-4 text-xs text-gray-500">

                    Finding footage for each
                    scene...

                  </p>

                </div>

              )}


              {!searchingVideos &&
                videos.length > 0 && (

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                    {videos.map(
                      (video, index) => (

                        <div
                          key={index}
                          className="overflow-hidden rounded-xl border border-white/[0.06] bg-black"
                        >

                          {video?.videoFile ? (

                            <video

                              src={
                                video.videoFile
                              }

                              poster={
                                video.image
                              }

                              controls

                              playsInline

                              preload="metadata"

                              className="aspect-[9/16] w-full object-cover"

                            />

                          ) : (

                            <div className="flex aspect-[9/16] items-center justify-center p-4 text-center text-[10px] text-yellow-500">

                              No footage

                            </div>

                          )}

                          <div className="border-t border-white/[0.06] px-3 py-2">

                            <p className="text-[10px] text-gray-600">

                              Scene {index + 1}

                            </p>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}


              {!searchingVideos &&
                videos.length === 0 && (

                  <button

                    onClick={() =>
                      findVideos(
                        result
                      )
                    }

                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs transition hover:bg-white/[0.06]"

                  >

                    <VideoIcon />

                    Find stock footage

                  </button>

                )}

            </div>


            {/* =================================================
                FINAL RENDER
            ================================================= */}

            {audioData &&
              videos.length > 0 && (

                <div className="rounded-2xl border border-violet-400/10 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-5">

                  <div className="flex items-start gap-4">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">

                      <SparklesIcon />

                    </div>


                    <div>

                      <p className="text-sm font-medium">

                        Everything is ready

                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-500">

                        Combine your narration,
                        footage and captions into
                        the final Short.

                      </p>

                    </div>

                  </div>


                  {rendering && (

                    <div className="mt-5">

                      <div className="mb-2 flex justify-between text-[10px]">

                        <span className="text-gray-500">

                          Rendering locally...

                        </span>

                        <span className="text-gray-300">

                          {renderProgress}%

                        </span>

                      </div>


                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">

                        <div

                          className="h-full rounded-full bg-violet-400 transition-all duration-300"

                          style={{
                            width:
                              `${renderProgress}%`,
                          }}

                        />

                      </div>

                    </div>

                  )}


                  <button

                    onClick={
                      createFinalVideo
                    }

                    disabled={
                      rendering ||
                      videos.length !==
                        result.scenes.length ||
                      videos.some(
                        (v) =>
                          !v?.videoFile
                      )
                    }

                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-4 text-sm font-semibold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"

                  >

                    {rendering ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                        Rendering {renderProgress}%
                      </>
                    ) : (
                      <>
                        <VideoIcon />
                        Create Final Video
                      </>
                    )}

                  </button>


                  <p className="mt-3 text-center text-[9px] text-gray-700">

                    Rendering happens locally
                    on your device.

                  </p>

                </div>

              )}


            {/* =================================================
                FINAL VIDEO
            ================================================= */}

            {finalVideoUrl && (

              <div className="overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.025]">

                <div className="p-5">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">

                      <CheckIcon />

                    </div>


                    <div>

                      <p className="text-sm font-semibold">

                        Your Short is ready

                      </p>

                      <p className="mt-0.5 text-[10px] text-gray-600">

                        Final video rendered locally

                      </p>

                    </div>

                  </div>


                  <div className="overflow-hidden rounded-xl bg-black">

                    <video

                      src={
                        finalVideoUrl
                      }

                      controls

                      playsInline

                      preload="metadata"

                      className="mx-auto aspect-[9/16] max-h-[650px] w-full object-contain"

                    />

                  </div>


                  <a

                    href={
                      finalVideoUrl
                    }

                    download="ai-short.mp4"

                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-xs font-semibold text-black transition hover:bg-gray-100"

                  >

                    <DownloadIcon />

                    Download MP4

                  </a>


                  <button

                    onClick={() => {

                      if (
                        finalVideoUrl
                      ) {

                        URL.revokeObjectURL(
                          finalVideoUrl
                        );

                      }

                      setFinalVideoUrl(
                        null
                      );

                    }}

                    className="mt-2 w-full py-2 text-[10px] text-gray-600 hover:text-white"

                  >

                    Create another Short

                  </button>

                </div>

              </div>

            )}

          </div>

        )}

      </section>


      {/* =================================================
          SEO CONTENT
      ================================================= */}

      <section
        className="mx-auto mt-20 max-w-4xl px-4 pb-16 sm:px-6"
        aria-labelledby="seo-heading"
      >

        <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8">

          <h2
            id="seo-heading"
            className="text-xl font-semibold text-white"
          >

            Free AI Video Generator for Short-Form Content

          </h2>


          <p className="mt-4 text-sm leading-7 text-gray-500">

            AI Shorts helps you turn an idea into a complete
            short-form video. Enter a topic and generate a script,
            AI narration, relevant stock footage and a vertical
            video ready for platforms such as YouTube Shorts,
            Instagram Reels and TikTok.

          </p>


          <h2 className="mt-8 text-lg font-semibold text-white">

            How does the AI video generator work?

          </h2>


          <p className="mt-3 text-sm leading-7 text-gray-500">

            Enter the topic you want to create a video about.
            The application generates the short script and scene
            breakdown, creates the narration, searches for suitable
            stock footage and combines everything into a 9:16 video.

          </p>


          <h2 className="mt-8 text-lg font-semibold text-white">

            What can you create with AI Shorts?

          </h2>


          <p className="mt-3 text-sm leading-7 text-gray-500">

            You can create educational videos, documentary-style
            Shorts, mysterious stories, news-style videos, cinematic
            content, storytelling videos and other short-form content.

          </p>


          <div className="mt-8 grid gap-3 sm:grid-cols-2">

            {[
              "Free AI video generator",
              "AI YouTube Shorts generator",
              "AI Instagram Reels generator",
              "AI voiceover generator",
              "AI script generator",
              "Automatic 9:16 video creation",
            ].map(
              (item) => (

                <div
                  key={item}
                  className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-xs text-gray-500"
                >

                  {item}

                </div>

              )
            )}

          </div>

        </div>

      </section>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t border-white/[0.06]">

        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-7 sm:flex-row sm:px-6">

          <p className="text-[10px] text-gray-700">

            AI Shorts

          </p>

          <p className="text-[10px] text-gray-700">

            Your APIs • Your browser • Your content

          </p>

        </div>

      </footer>


      {/* =================================================
          SETTINGS MODAL
      ================================================= */}

      {showSettings && (

        <div

          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md"

          onClick={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {

              setShowSettings(false);

            }

          }}

        >

          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d11] shadow-2xl shadow-black/50">


            {/* MODAL HEADER */}

            <div className="border-b border-white/[0.07] px-5 py-5 sm:px-6">

              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">

                      <SettingsIcon />

                    </div>

                    <h2 className="font-semibold">

                      API Settings

                    </h2>

                  </div>


                  <p className="mt-3 text-xs leading-5 text-gray-600">

                    Connect your own API keys.
                    They are stored only in this
                    browser.

                  </p>

                </div>


                <button

                  onClick={() =>
                    setShowSettings(false)
                  }

                  className="text-xl text-gray-600 transition hover:text-white"

                >

                  ×

                </button>

              </div>

            </div>


            <div className="p-5 sm:p-6">


              {/* GEMINI */}

              <div>

                <label className="text-xs font-medium text-gray-400">

                  Gemini API Key

                </label>


                <input

                  type="password"

                  value={geminiKey}

                  onChange={(e) =>
                    setGeminiKey(
                      e.target.value
                    )
                  }

                  placeholder="Paste your Gemini API key"

                  autoComplete="off"

                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-white outline-none transition placeholder:text-gray-700 focus:border-violet-400/30"

                />


                <a

                  href="https://aistudio.google.com/apikey"

                  target="_blank"

                  rel="noopener noreferrer"

                  className="mt-2 inline-block text-[10px] text-violet-400 hover:text-violet-300"

                >

                  Get a Gemini API key →

                </a>

              </div>


              {/* PEXELS */}

              <div className="mt-5">

                <label className="text-xs font-medium text-gray-400">

                  Pexels API Key

                </label>


                <input

                  type="password"

                  value={pexelsKey}

                  onChange={(e) =>
                    setPexelsKey(
                      e.target.value
                    )
                  }

                  placeholder="Paste your Pexels API key"

                  autoComplete="off"

                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-xs text-white outline-none transition placeholder:text-gray-700 focus:border-violet-400/30"

                />


                <a

                  href="https://www.pexels.com/api/"

                  target="_blank"

                  rel="noopener noreferrer"

                  className="mt-2 inline-block text-[10px] text-violet-400 hover:text-violet-300"

                >

                  Get a Pexels API key →

                </a>

              </div>


              {/* PRIVACY */}

              <div className="mt-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-3.5">

                <div className="flex gap-2.5">

                  <span className="text-sm">
                    🔒
                  </span>

                  <p className="text-[10px] leading-5 text-emerald-300/70">

                    Keys are stored in your
                    browser's local storage and
                    are used from your device.

                  </p>

                </div>

              </div>


              {/* ACTIONS */}

              <button

                onClick={
                  saveSettings
                }

                className="mt-5 w-full rounded-xl bg-white px-5 py-3.5 text-xs font-semibold text-black transition hover:bg-gray-100"

              >

                Save Settings

              </button>


              {(geminiKey ||
                pexelsKey) && (

                <button

                  onClick={
                    removeKeys
                  }

                  className="mt-2 w-full rounded-xl py-2.5 text-[10px] text-red-400/70 transition hover:bg-red-500/5 hover:text-red-400"

                >

                  Remove saved keys

                </button>

              )}

            </div>

          </div>

        </div>

      )}

    </main>

  );

}