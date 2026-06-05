// ── Constants ─────────────────────────────────────────────────────

export const OUTPUT_FORMATS = [
	{ label: "MP4 (.mp4)", ext: "mp4", mime: "video/mp4" },
	{ label: "WebM (.webm)", ext: "webm", mime: "video/webm" },
	{ label: "MKV (.mkv)", ext: "mkv", mime: "video/x-matroska" },
	{ label: "MOV (.mov)", ext: "mov", mime: "video/quicktime" },
	{ label: "AVI (.avi)", ext: "avi", mime: "video/x-msvideo" },
	{ label: "FLV (.flv)", ext: "flv", mime: "video/x-flv" },
	{ label: "MPEG-TS (.ts)", ext: "ts", mime: "video/mp2t" },
	{ label: "OGG (.ogg)", ext: "ogg", mime: "video/ogg" },
] as const;

export const AUDIO_BITRATE_KBPS = 128;
export const WASM_FFMPEG_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

// VP9/Opus are too memory-intensive for WASM — use lighter codecs
export const WASM_CODEC_OVERRIDES: Record<string, string[]> = {
	webm: ["-c:v", "libvpx", "-c:a", "libvorbis"],
	ogg: ["-c:v", "libtheora", "-c:a", "libvorbis"],
};

// Native FFmpeg: use faster encoding presets (VP9 default is extremely slow)
export const NATIVE_CODEC_OVERRIDES: Record<string, string[]> = {
	webm: ["-c:v", "libvpx-vp9", "-cpu-used", "4", "-deadline", "good", "-row-mt", "1"],
	ogg: ["-c:v", "libtheora", "-c:a", "libvorbis"],
};
