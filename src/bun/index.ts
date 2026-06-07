import { BrowserWindow, BrowserView, Updater, Utils, Screen } from "electrobun/bun";
import { type AppRPCType } from "../shared/types";
import { basename, dirname, extname, join } from "path";
import { homedir } from "os";
import { update } from "./updater";

const getBinaryPathAsync = async (name: "ffmpeg" | "ffprobe"): Promise<string> => {
	if (process.platform === "darwin") {
		const paths = [
			`/opt/homebrew/bin/${name}`,
			`/usr/local/bin/${name}`,
			`/opt/local/bin/${name}`,
		];
		for (const p of paths) {
			if (await Bun.file(p).exists()) {
				return p;
			}
		}
	}
	return name;
}

const ffmpegPathPromise = getBinaryPathAsync("ffmpeg");
const ffprobePathPromise = getBinaryPathAsync("ffprobe");

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// ── Preview file server ──────────────────────────────────────────

let currentVideoPath: string | null = null;

const previewServer = Bun.serve({
	port: 0,
	async fetch(req) {
		if (req.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
					"Access-Control-Allow-Headers": "Range, Content-Type",
					"Access-Control-Max-Age": "86400",
				},
			});
		}

		if (!currentVideoPath) {
			return new Response("No file selected", { status: 404 });
		}

		const file = Bun.file(currentVideoPath);
		if (!(await file.exists())) {
			return new Response("File not found", { status: 404 });
		}

		return new Response(file, {
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
				"Access-Control-Allow-Headers": "Range, Content-Type",
				"Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
				"Accept-Ranges": "bytes",
			},
		});
	},
});

const PREVIEW_PORT: number = previewServer.port ?? 0;
console.log(`[YAFW] Preview server on port ${PREVIEW_PORT}`);

// ── Output path generation ───────────────────────────────────────

async function generateOutputPath(inputPath: string, outputExt: string): Promise<string> {
	const dir = dirname(inputPath);
	const base = basename(inputPath, extname(inputPath));
	const stem = `${base}-yafw`;

	let candidate = join(dir, `${stem}.${outputExt}`);
	let counter = 1;

	while (await Bun.file(candidate).exists()) {
		counter++;
		candidate = join(dir, `${stem}-${counter}.${outputExt}`);
	}

	return candidate;
}

// ── RPC handlers ─────────────────────────────────────────────────

let currentExportProgress = 0;

const rpc = BrowserView.defineRPC<AppRPCType>({
	maxRequestTime: 600_000,
	handlers: {
		requests: {
			selectInputFile: async () => {
				console.log("[YAFW] selectInputFile called");
				try {
					const chosenPaths = await Utils.openFileDialog({
						startingFolder: join(homedir(), "Videos"),
						allowedFileTypes: "*",
						canChooseFiles: true,
						canChooseDirectory: false,
						allowsMultipleSelection: false,
					});

					console.log("[YAFW] openFileDialog returned:", chosenPaths);
					// openFileDialog returns [""] on cancel, not null
					const rawPath = chosenPaths && chosenPaths.length > 0 ? chosenPaths[0] : "";
					const path = rawPath && rawPath.length > 0 ? rawPath : null;

					if (path) {
						currentVideoPath = path;
						console.log(`[YAFW] Selected: ${path}`);
					} else {
						console.log("[YAFW] No file selected (cancelled)");
					}

					return { path, previewPort: PREVIEW_PORT };
				} catch (err) {
					console.error("[YAFW] selectInputFile error:", err);
					return { path: null, previewPort: PREVIEW_PORT };
				}
			},

			exportVideo: async ({ inputPath, ffmpegArgs, outputExt, clipDuration }) => {
				console.log("[YAFW] exportVideo called");
				console.log("[YAFW]   inputPath:", inputPath);
				console.log("[YAFW]   outputExt:", outputExt);
				console.log("[YAFW]   clipDuration:", clipDuration);
				console.log("[YAFW]   ffmpegArgs:", ffmpegArgs.join(" "));

				try {
					currentExportProgress = 0;
					const outputPath = await generateOutputPath(inputPath, outputExt);
					console.log("[YAFW]   outputPath:", outputPath);

					const fullArgs = [
						"-y", "-i", inputPath,
						...ffmpegArgs,
						"-progress", "pipe:1",
						outputPath,
					];
					console.log(`[FFmpeg] ffmpeg ${fullArgs.join(" ")}`);

					const proc = Bun.spawn([await ffmpegPathPromise, ...fullArgs], {
						stdout: "pipe",
						stderr: "pipe",
					});

					const totalUs = clipDuration * 1_000_000;

					// Read stdout (progress) and stderr (errors) in parallel to avoid deadlock
					const stdoutPromise = (async () => {
						const decoder = new TextDecoder();
						let buffer = "";
						for await (const chunk of proc.stdout) {
							buffer += decoder.decode(chunk, { stream: true });
							const lines = buffer.split("\n");
							buffer = lines.pop() || "";
							for (const line of lines) {
								const match = line.match(/^out_time_us=(\d+)/);
								if (match && totalUs > 0) {
									currentExportProgress = Math.min(0.99, parseInt(match[1]) / totalUs);
								}
							}
						}
					})();

					const stderrPromise = new Response(proc.stderr).text();

					// Wait for both streams AND process exit
					await Promise.all([stdoutPromise, stderrPromise, proc.exited]);

					console.log(`[FFmpeg] Exit code: ${proc.exitCode}`);

					if (proc.exitCode !== 0) {
						const stderrText = await stderrPromise;
						currentExportProgress = 0;
						console.error("[FFmpeg] stderr:", stderrText.slice(-500));
						return {
							success: false,
							error: `FFmpeg exited with code ${proc.exitCode}: ${stderrText.slice(-500)}`,
						};
					}

					currentExportProgress = 1;
					console.log(`[YAFW] Export complete: ${outputPath}`);

					// Reveal in file manager
					try {
						Utils.showItemInFolder(outputPath);
					} catch (e) {
						console.warn("[YAFW] showItemInFolder failed:", e);
					}

					return { success: true, outputPath };
				} catch (err) {
					currentExportProgress = 0;
					console.error("[YAFW] exportVideo error:", err);
					return { success: false, error: String(err) };
				}
			},

			getExportProgress: () => {
				return { progress: currentExportProgress };
			},

			probeVideo: async ({ inputPath }) => {
				console.log("[YAFW] probeVideo:", inputPath);
				try {
					const proc = Bun.spawn([
						await ffprobePathPromise,
						"-v", "error",
						"-select_streams", "v:0",
						"-show_entries", "stream=r_frame_rate,width,height,bit_rate,duration:format=duration",
						"-of", "json",
						inputPath,
					], { stdout: "pipe", stderr: "pipe" });

					const output = await new Response(proc.stdout).text();
					await proc.exited;

					const data = JSON.parse(output);
					const stream = data?.streams?.[0] ?? {};
					const format = data?.format ?? {};

					// Parse r_frame_rate fraction (e.g. "30000/1001" → 29.97)
					let fps = 30;
					if (stream.r_frame_rate) {
						const [num, den] = stream.r_frame_rate.split("/").map(Number);
						if (den > 0) fps = Math.round((num / den) * 100) / 100;
					}

					const width = stream.width ?? 1920;
					const height = stream.height ?? 1080;
					// bit_rate is in bps, convert to kbps
					const bitrate = stream.bit_rate ? Math.round(parseInt(stream.bit_rate) / 1000) : 0;
					const duration = parseFloat(stream.duration || format.duration || "0");

					console.log(`[YAFW] Probe: ${width}x${height} @ ${fps}fps, ${bitrate}kbps, duration: ${duration}s`);
					return { fps, width, height, bitrate, duration };
				} catch (err) {
					console.error("[YAFW] probeVideo error:", err);
					return { fps: 30, width: 1920, height: 1080, bitrate: 0, duration: 0 };
				}
			},

			detectHardwareAccelerators: async () => {
				console.log("[YAFW] detectHardwareAccelerators called");
				try {
					const proc = Bun.spawn([await ffmpegPathPromise, "-encoders"], {
						stdout: "pipe",
						stderr: "pipe",
					});
					const output = await new Response(proc.stdout).text();
					await proc.exited;

					const supported: string[] = [];
					const candidates = [
						"h264_nvenc",
						"h264_videotoolbox",
						"h264_qsv",
						"h264_amf",
						"h264_mf",
						"hevc_nvenc",
						"hevc_videotoolbox",
						"hevc_qsv",
						"hevc_amf",
						"hevc_mf",
						"vp9_nvenc",
						"vp9_qsv"
					];
					for (const encoder of candidates) {
						if (output.includes(encoder)) {
							supported.push(encoder);
						}
					}
					console.log("[YAFW] Supported hardware encoders found:", supported);
					return { supportedEncoders: supported };
				} catch (err) {
					console.error("[YAFW] detectHardwareAccelerators error:", err);
					return { supportedEncoders: [] };
				}
			},

			update: async () => {
				console.log("[YAFW] update check called");
				try {
					const check = await Updater.checkForUpdate();
        			const updating = !!check.updateAvailable;
					updating && update(); // Don't await, run in background
					return { updating };
				} catch (err) {
					console.error("[YAFW] update RPC handler failed:", err);
					return { updating: false };
				}
			}
		},
		messages: {},
	},
});

// ── Main window ──────────────────────────────────────────────────

async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log("[YAFW] Using Vite dev server");
			return DEV_SERVER_URL;
		} catch {
			console.log("[YAFW] Vite not running, using bundled view");
		}
	}
	return "views://mainview/index.html";
}

const url = await getMainViewUrl();
console.log("[YAFW] Loading URL:", url);

const windowWidth = 1280;
const windowHeight = 1000;
let x = 100;
let y = 100;

try {
	const primary = Screen.getPrimaryDisplay();
	const workArea = primary.workArea || primary.bounds;
	if (workArea && workArea.width && workArea.height) {
		x = Math.round(workArea.x + (workArea.width - windowWidth) / 2);
		y = Math.round(workArea.y + (workArea.height - windowHeight) / 2);
	}
} catch (e) {
	console.error("[YAFW] Failed to calculate centered window position:", e);
	x = 510;
	y = 200;
}

const mainWindow = new BrowserWindow({
	title: "YAFW",
	url,
	rpc,
	frame: {
		width: windowWidth,
		height: windowHeight,
		x,
		y,
	},
	// hiddenInset gives a clean look on macOS, but on Windows it removes
	// the minimize/maximize/close buttons — so only use it on macOS.
	...(process.platform === "darwin" ? { titleBarStyle: "hiddenInset" } : {}),
});

mainWindow.setTitle("YAFW - Yet Another FFmpeg Wrapper");
console.log("[YAFW] Window created, RPC active");

// Open DevTools in dev mode for debugging
// mainWindow.webview.openDevTools();

// Log when the webview is ready
mainWindow.webview.on("dom-ready", () => {
	console.log("[YAFW] Webview DOM ready");
});