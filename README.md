# One-Click AI Gen 🎬

> **Free AI Shorts & Video Generator — turn an idea into a finished vertical video with AI-generated scripts, voiceover, stock footage and captions.**

🌐 **Live Demo:** https://one-click-aigen.vercel.app/

---

## 🚀 What is One-Click AI Gen?

**One-Click AI Gen** is a free AI-powered video generator designed for creating short-form videos such as **YouTube Shorts, Instagram Reels and TikTok-style vertical videos**.

Enter a topic, choose your language, style and voice, and the application generates:

* 📝 AI-generated video script
* 🎣 Attention-grabbing hook
* 🎙️ AI voiceover
* 🎥 Relevant stock footage
* 💬 On-screen captions
* 📱 Vertical 9:16 video
* 🎬 Final downloadable MP4

The complete video can be rendered locally in the user's browser/device.

---

## ✨ Features

### 🤖 AI Script Generation

Generate short-form scripts from a simple topic using Google's Gemini API.

Supported content styles include:

* Documentary
* Educational
* Mysterious
* Funny
* Dramatic
* Storytelling
* News-style
* Cinematic

### 🌎 Multiple Languages

Currently supports:

* English
* Hindi
* Hinglish

### 🎙️ AI Voiceover

Generate narration for your video using Gemini's voice capabilities.

Available voices include:

* Kore
* Puck
* Charon
* Zephyr
* Fenrir
* Leda
* Aoede
* Iapetus
* Algieba
* Gacrux

### 🎥 Stock Video Footage

The application searches **Pexels** for stock footage relevant to each generated scene.

### 📱 Vertical Video

Videos are designed for short-form platforms using a **9:16 vertical format**.

### 💻 Local Rendering

The final video is rendered locally rather than requiring a paid cloud rendering service.

### 🔐 Bring Your Own API Keys

Users provide their own:

* Gemini API key
* Pexels API key

API keys are stored locally in the user's browser and are not provided by the application.

---

## 🆓 Is It Free?

**Yes.**

One-Click AI Gen does not require a subscription to use the application.

However, users need their own API keys for the services used by the application.

Depending on the provider, API usage may be subject to that provider's own quotas, limits or pricing policies.

---

## 🔒 Privacy

One-Click AI Gen is designed around a **bring-your-own-key** model.

Your API keys are stored in your browser's local storage and are used from your device.

The application does not require users to create an account.

> Never share your API keys publicly or commit them to GitHub.

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### AI

* Google Gemini API

### Text-to-Speech

* Gemini voice generation

### Stock Footage

* Pexels API

### Video Processing

* FFmpeg
* Browser/local rendering

### Deployment

* Vercel

---

## 🏗️ How It Works

```text
User enters a topic
        │
        ▼
   Gemini generates
      the script
        │
        ▼
   Generate AI
     voiceover
        │
        ▼
 Search Pexels for
   scene footage
        │
        ▼
 Match footage with
      scenes
        │
        ▼
 Local FFmpeg
    rendering
        │
        ▼
   Final 9:16 MP4
```

---

## 📋 Example Workflow

1. Open the application.
2. Add your Gemini API key.
3. Add your Pexels API key.
4. Enter a topic.
5. Select a language.
6. Select a video style.
7. Select a voice.
8. Click **Create 20-Second Short**.
9. Gemini generates the script and narration.
10. Relevant stock footage is retrieved from Pexels.
11. The scenes are combined with the narration.
12. FFmpeg renders the final vertical video.
13. Download the generated MP4.

---

## 💻 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/aRPIT0313/one-click-aigen.git
cd one-click-aigen
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🔑 API Keys

The application uses user-provided API keys.

### Gemini

Get a Gemini API key from:

https://aistudio.google.com/apikey

### Pexels

Get a Pexels API key from:

https://www.pexels.com/api/

API keys should **not** be hardcoded into the source code.

---

## ⚠️ API Usage & Limits

One-Click AI Gen depends on external APIs.

Therefore:

* Gemini quotas can affect script/voice generation.
* Pexels API limits can affect stock footage searches.
* Provider availability can change.
* API usage is subject to the respective provider's terms and limits.

The application itself does not guarantee unlimited API usage.

---

## 📁 Project Structure

```text
one-click-aigen/
│
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── sitemap.ts
│   └── robots.ts
│
├── lib/
│   ├── gemini.ts
│   ├── pexels.ts
│   ├── tts.ts
│   └── renderer.ts
│
├── public/
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 🎯 Use Cases

One-Click AI Gen can be used for creating:

* YouTube Shorts
* Instagram Reels
* TikTok-style videos
* Educational Shorts
* Fact videos
* Documentary Shorts
* Science videos
* History videos
* Technology videos
* News-style short videos
* Storytelling videos
* Hindi Shorts
* Hinglish Shorts

---

## 🌐 Live Application

Try the free AI video generator:

**https://one-click-aigen.vercel.app/**

---

## 🤝 Contributing

Contributions, suggestions and improvements are welcome.

If you find a bug or have an idea for improving One-Click AI Gen:

1. Open an issue.
2. Describe the problem or feature.
3. Include steps to reproduce the issue when applicable.

Pull requests are also welcome.

---

## 🐛 Issues

If you encounter a problem, please open a GitHub issue with:

* What you were trying to do
* What happened
* Any error message
* Browser and operating system
* Relevant console output, if available

**Never include your API keys in an issue.**

---

## 📌 Project Status

One-Click AI Gen is an actively developed project.

New features and improvements are being added over time.

---

## 📄 License

Add your preferred license to the repository before publishing the project publicly.

---

## ⭐ Support the Project

If you find **One-Click AI Gen** useful:

⭐ Star the repository
🐛 Report bugs
💡 Suggest features
🔗 Share the project

---

### One-Click AI Gen

**A simple, free AI video generator for creating short-form content.**

🌐 https://one-click-aigen.vercel.app/
