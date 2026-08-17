export function createSRT(text: string) {

  const words = text.split(" ");

  const chunk = Math.ceil(words.length / 5);

  let srt = "";

  for (let i = 0; i < 5; i++) {

    const start = i * 4;
    const end = (i + 1) * 4;

    const sentence = words
      .slice(i * chunk, (i + 1) * chunk)
      .join(" ");

    srt += `${i + 1}
00:00:${String(start).padStart(2,"0")},000 --> 00:00:${String(end).padStart(2,"0")},000
${sentence}

`;
  }

  return srt;
}