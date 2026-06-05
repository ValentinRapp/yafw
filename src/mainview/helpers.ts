// ── Pure helper functions ─────────────────────────────────────────

/** Extract file extension from a filename, defaulting to "mp4". */
export const getFileExt = (name: string): string =>
	(name.split(".").pop() || "mp4").toLowerCase();

/** Detect the user's operating system from the user agent string. */
export const getDetectedOS = (): "mac" | "windows" | "linux" => {
	if (typeof window === "undefined") return "windows";
	const ua = navigator.userAgent.toLowerCase();
	if (ua.includes("mac")) return "mac";
	if (ua.includes("linux")) return "linux";
	return "windows";
};

/** Pick the best available hardware-accelerated H.264 encoder. */
export const getBestH264Encoder = (supported: string[]): string | null => {
	if (supported.includes("h264_nvenc")) return "h264_nvenc";
	if (supported.includes("h264_videotoolbox")) return "h264_videotoolbox";
	if (supported.includes("h264_qsv")) return "h264_qsv";
	if (supported.includes("h264_amf")) return "h264_amf";
	if (supported.includes("h264_mf")) return "h264_mf";
	return null;
};

/** Pick the best available hardware-accelerated VP9 encoder. */
export const getBestVP9Encoder = (supported: string[]): string | null => {
	if (supported.includes("vp9_nvenc")) return "vp9_nvenc";
	if (supported.includes("vp9_qsv")) return "vp9_qsv";
	return null;
};
