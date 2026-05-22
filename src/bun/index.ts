import { BrowserWindow, BrowserView, Updater } from "electrobun/bun";
import { type AppRPCType } from "../shared/types";
import { platform } from "os";
import { basename, dirname, extname, join } from "path";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
const VIDEO_FILTER = "*.mp4;*.webm;*.mkv;*.mov;*.avi;*.flv;*.ts;*.ogg";

// ── Preview file server ──────────────────────────────────────────
// Serves the currently selected video file to the webview for preview.

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

console.log(`[YAFW] Preview server started on port ${previewServer.port}`);

// ── Native file dialog (open only) ──────────────────────────────

async function showOpenFileDialog(): Promise<string | null> {
	const os = platform();

	if (os === "win32") {
		const script = `
			Add-Type -AssemblyName System.Windows.Forms
			$f = New-Object System.Windows.Forms.Form
			$f.TopMost = $true
			$f.ShowInTaskbar = $false
			$f.WindowState = 'Minimized'
			$d = New-Object System.Windows.Forms.OpenFileDialog
			$d.Filter = "Video files|${VIDEO_FILTER}|All files|*.*"
			$result = $d.ShowDialog($f)
			$f.Dispose()
			if ($result -eq [System.Windows.Forms.DialogResult]::OK) { $d.FileName }
		`;
		const proc = Bun.spawn(
			["powershell", "-NoProfile", "-STA", "-Command", script],
			{ stdout: "pipe", stderr: "pipe" },
		);
		const stdoutPromise = new Response(proc.stdout).text();
		const stderrPromise = new Response(proc.stderr).text();
		await proc.exited;
		const stderr = (await stderrPromise).trim();
		if (stderr) console.warn(`[YAFW] Open dialog stderr: ${stderr}`);
		return (await stdoutPromise).trim() || null;
	}

	if (os === "darwin") {
		const proc = Bun.spawn(
			[
				"osascript", "-e",
				'POSIX path of (choose file of type {"public.movie"} with prompt "Select a video file")',
			],
			{ stdout: "pipe", stderr: "pipe" },
		);
		await proc.exited;
		return (await new Response(proc.stdout).text()).trim() || null;
	}

	// Linux: zenity
	const proc = Bun.spawn(
		["zenity", "--file-selection", `--file-filter=Video files | ${VIDEO_FILTER.replace(/;/g, " ")}`],
		{ stdout: "pipe", stderr: "pipe" },
	);
	await proc.exited;
	return (await new Response(proc.stdout).text()).trim() || null;
}

// ── Output path generation ───────────────────────────────────────
// Saves next to the source file: video.mp4 → video-yafw.webm
// Adds a counter if the file already exists: video-yafw-2.webm

async function generateOutputPath(
	inputPath: string,
	outputExt: string,
): Promise<string> {
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
	maxRequestTime: 600_000, // 10 min timeout for video exports
	handlers: {
		requests: {
			selectInputFile: async () => {
				const path = await showOpenFileDialog();
				if (path) {
					currentVideoPath = path;
					console.log(`[YAFW] Selected input file: ${path}`);
				}
				return { path, previewPort: previewServer.port };
			},

			exportVideo: async ({ inputPath, ffmpegArgs, outputExt, clipDuration }) => {
				try {
					currentExportProgress = 0;
					const outputPath = await generateOutputPath(inputPath, outputExt);
					const fullArgs = [
						"-y", "-i", inputPath,
						...ffmpegArgs,
						"-progress", "pipe:1",
						outputPath,
					];
					console.log(`[FFmpeg] Running: ffmpeg ${fullArgs.join(" ")}`);
					console.log(`[FFmpeg] Output: ${outputPath}`);

					const proc = Bun.spawn(["ffmpeg", ...fullArgs], {
						stdout: "pipe",
						stderr: "pipe",
					});

					// Consume stderr in parallel to avoid pipe buffer deadlock
					const stderrPromise = new Response(proc.stderr).text();

					// Parse stdout for progress updates
					const totalUs = clipDuration * 1_000_000;
					if (totalUs > 0) {
						const decoder = new TextDecoder();
						let buffer = "";
						for await (const chunk of proc.stdout) {
							buffer += decoder.decode(chunk, { stream: true });
							const lines = buffer.split("\n");
							buffer = lines.pop() || "";
							for (const line of lines) {
								const match = line.match(/^out_time_us=(\d+)/);
								if (match) {
									currentExportProgress = Math.min(1, parseInt(match[1]) / totalUs);
								}
							}
						}
					}

					await proc.exited;

					if (proc.exitCode !== 0) {
						const stderr = await stderrPromise;
						currentExportProgress = 0;
						return {
							success: false,
							error: `FFmpeg exited with code ${proc.exitCode}: ${stderr}`,
						};
					}

					currentExportProgress = 1;
					console.log(`[YAFW] Export complete: ${outputPath}`);
					return { success: true, outputPath };
				} catch (err) {
					currentExportProgress = 0;
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
			return DEV_SERVER_URL;
		} catch {
			console.log("Vite dev server not running, falling back to bundled view.");
		}
	}
	return "views://mainview/index.html";
}

const url = await getMainViewUrl();

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