import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://one-click-aigen.vercel.app"),

  title: {
    default: "AI Shorts Generator – Create AI Videos Free",
    template: "%s | AI Shorts Generator",
  },

  description:
    "Create AI Shorts for free from a simple idea. Generate scripts, AI voiceovers, stock footage and finished 9:16 videos using your own Gemini and Pexels API keys.",

  keywords: [
    "AI Shorts Generator",
    "AI video generator",
    "AI video maker",
    "AI Shorts maker",
    "YouTube Shorts generator",
    "free AI video generator",
    "AI video generator free",
    "AI Shorts creator",
    "text to video AI",
    "AI content creator",
  ],

  authors: [
    {
      name: "AI Shorts",
    },
  ],

  creator: "AI Shorts",

  applicationName: "AI Shorts Generator",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    url: "https://one-click-aigen.vercel.app",
    siteName: "AI Shorts Generator",
    title: "AI Shorts Generator – Create AI Videos Free",
    description:
      "Create AI Shorts with AI-generated scripts, voiceovers and stock footage. Generate finished 9:16 videos directly in your browser.",
  },

  twitter: {
    card: "summary_large_image",
    title: "AI Shorts Generator – Create AI Videos Free",
    description:
      "Create AI Shorts with scripts, AI voiceovers and stock footage.",
  },

  alternates: {
    canonical: "https://one-click-aigen.vercel.app/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}