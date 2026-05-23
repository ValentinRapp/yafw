import { BrowserWindow, BrowserView, Updater, Utils } from "electrobun/bun";
import { type AppRPCType } from "../shared/types";
import { basename, dirname, extname, join } from "path";
import { homedir } from "os";

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
					"Access-Control-Allow-Methods": "GET, HEAD",
					"Access-Control-Allow-Headers": "Range",
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
			headers: { "Access-Control-Allow-Origin": "*" },
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

					const proc = Bun.spawn(["ffmpeg", ...fullArgs], {
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

const mainWindow = new BrowserWindow({
	title: "YAFW",
	url,
	rpc,
	frame: {
		width: 900,
		height: 700,
		x: 200,
		y: 200,
	},
});

mainWindow.setTitle("YAFW - Yet Another FFmpeg Wrapper");
console.log("[YAFW] Window created, RPC active");

// Open DevTools in dev mode for debugging
mainWindow.webview.openDevTools();

// Log when the webview is ready
mainWindow.webview.on("dom-ready", () => {
	console.log("[YAFW] Webview DOM ready");
});