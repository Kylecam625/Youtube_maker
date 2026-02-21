export function exportAsPlainText(text: string, filename: string = "script.txt") {
  downloadFile(text, filename, "text/plain");
}

export function exportAsSRT(sections: { start: string; end: string; text: string }[], filename: string = "subtitles.srt") {
  const srt = sections
    .map((s, i) => `${i + 1}\n${s.start} --> ${s.end}\n${s.text}\n`)
    .join("\n");
  downloadFile(srt, filename, "text/srt");
}

export function exportAsChapterList(chapters: { time: string; title: string }[]): string {
  return chapters.map((ch) => `${ch.time} ${ch.title}`).join("\n");
}

export function exportAsShotList(brollMarkers: string[]): string {
  return brollMarkers.map((marker, i) => `${i + 1}. ${marker}`).join("\n");
}

export function exportAsJSON(data: unknown, filename: string = "data.json") {
  downloadFile(JSON.stringify(data, null, 2), filename, "application/json");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
