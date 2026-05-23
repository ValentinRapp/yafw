import type { RPCSchema } from "electrobun/bun";

export type AppRPCType = {
	bun: RPCSchema<{
		requests: {
			/** Opens a native file dialog and starts serving the file for preview */
			selectInputFile: {
				params: {};
				response: { path: string | null; previewPort: number };
			};
			/** Runs native FFmpeg, saves output next to the input file */
			exportVideo: {
				params: {
					inputPath: string;
					ffmpegArgs: string[];
					outputExt: string;
					clipDuration: number;
				};
				response: {
					success: boolean;
					outputPath?: string;
					error?: string;
				};
			};
			/** Returns current export progress (0–1) */
			getExportProgress: {
				params: {};
				response: { progress: number };
			};
			/** Runs ffprobe to get video metadata (fps, resolution, bitrate) */
			probeVideo: {
				params: { inputPath: string };
				response: {
					fps: number;
					width: number;
					height: number;
					bitrate: number; // kbps
				};
			};
		};
		messages: {};
	}>;
	webview: RPCSchema<{
		requests: {};
		messages: {};
	}>;
};