// =====================================================
// TYPES
// =====================================================

export interface PexelsVideo {
  id: number;
  url: string;
  image: string;
  duration: number;
  videoFile: string;
  photographer?: string;
}

// =====================================================
// API RESPONSE
// =====================================================

interface PexelsResponse {
  videos?: any[];
}

// =====================================================
// NORMALIZE QUERY
// =====================================================

function normalizeQuery(
  query: string
): string {
  return query
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 8)
    .join(" ");
}

// =====================================================
// FIND BEST VIDEO
// =====================================================

function selectBestVideo(
  videos: any[]
): PexelsVideo | null {
  if (!videos?.length) {
    return null;
  }

  const candidates: any[] = [];

  for (const video of videos) {
    const files =
      video.video_files || [];

    const portrait =
      video.width < video.height;

    const mp4Files =
      files.filter(
        (file: any) =>
          file.file_type ===
          "video/mp4"
      );

    for (const file of mp4Files) {
      candidates.push({
        video,
        file,
        portrait,
      });
    }
  }

  if (!candidates.length) {
    return null;
  }

  candidates.sort(
    (a, b) => {
      // Portrait first.
      if (
        a.portrait !==
        b.portrait
      ) {
        return a.portrait
          ? -1
          : 1;
      }

      // Prefer 720/1080-ish files.
      const aPixels =
        (a.file.width || 0) *
        (a.file.height || 0);

      const bPixels =
        (b.file.width || 0) *
        (b.file.height || 0);

      if (
        aPixels !==
        bPixels
      ) {
        return bPixels - aPixels;
      }

      // Longer source clips are useful.
      return (
        (b.video.duration || 0) -
        (a.video.duration || 0)
      );
    }
  );

  const selected =
    candidates[0];

  return {
    id: selected.video.id,
    url: selected.video.url,
    image: selected.video.image,
    duration:
      selected.video.duration || 0,
    videoFile:
      selected.file.link,
    photographer:
      selected.video.user?.name ||
      "Pexels contributor",
  };
}

// =====================================================
// SINGLE SEARCH
// =====================================================

export async function searchPexelsVideo(
  apiKey: string,
  query: string
): Promise<PexelsVideo | null> {
  if (!apiKey) {
    throw new Error(
      "Pexels API key is missing."
    );
  }

  const normalized =
    normalizeQuery(query);

  if (!normalized) {
    return null;
  }

  const response =
    await fetch(
      "https://api.pexels.com/v1/videos/search?" +
        new URLSearchParams({
          query: normalized,
          orientation: "portrait",
          size: "medium",
          per_page: "12",
        }),
      {
        method: "GET",
        headers: {
          Authorization: apiKey,
        },
      }
    );

  if (!response.ok) {
    if (
      response.status === 401
    ) {
      throw new Error(
        "Invalid Pexels API key."
      );
    }

    if (
      response.status === 429
    ) {
      throw new Error(
        "Pexels rate limit reached. Please wait before generating another video."
      );
    }

    throw new Error(
      `Pexels request failed: ${response.status}`
    );
  }

  const data: PexelsResponse =
    await response.json();

  return selectBestVideo(
    data.videos || []
  );
}

// =====================================================
// PARALLEL SEARCH
// =====================================================

export async function searchPexelsVideos(
  apiKey: string,
  queries: string[],
  concurrency = 5,
  onProgress?: (
    completed: number,
    total: number
  ) => void
): Promise<
  (PexelsVideo | null)[]
> {
  if (!apiKey) {
    throw new Error(
      "Pexels API key is missing."
    );
  }

  const results:
    (PexelsVideo | null)[] =
    new Array(
      queries.length
    ).fill(null);

  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const index =
        nextIndex++;

      if (
        index >=
        queries.length
      ) {
        return;
      }

      try {
        results[index] =
          await searchPexelsVideo(
            apiKey,
            queries[index]
          );
      } finally {
        completed++;

        onProgress?.(
          completed,
          queries.length
        );
      }
    }
  }

  const workers =
    Math.min(
      concurrency,
      queries.length
    );

  await Promise.all(
    Array.from(
      { length: workers },
      () => worker()
    )
  );

  return results;
}