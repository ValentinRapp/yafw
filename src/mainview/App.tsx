import { useEffect, useRef, useState } from "react";
import { Player } from "./Player";
import { Timeline } from "./Timeline";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { type AppRPCType } from "../shared/types";

// ── Constants ─────────────────────────────────────────────────────

const OUTPUT_FORMATS = [
	{ label: "MP4 (.mp4)", ext: "mp4", mime: "video/mp4" },
	{ label: "WebM (.webm)", ext: "webm", mime: "video/webm" },
	{ label: "MKV (.mkv)", ext: "mkv", mime: "video/x-matroska" },
	{ label: "MOV (.mov)", ext: "mov", mime: "video/quicktime" },
	{ label: "AVI (.avi)", ext: "avi", mime: "video/x-msvideo" },
	{ label: "FLV (.flv)", ext: "flv", mime: "video/x-flv" },
	{ label: "MPEG-TS (.ts)", ext: "ts", mime: "video/mp2t" },
	{ label: "OGG (.ogg)", ext: "ogg", mime: "video/ogg" },
] as const;

const AUDIO_BITRATE_KBPS = 128;
const WASM_FFMPEG_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

// VP9/Opus are too memory-intensive for WASM — use lighter codecs
const WASM_CODEC_OVERRIDES: Record<string, string[]> = {
	webm: ["-c:v", "libvpx", "-c:a", "libvorbis"],
	ogg: ["-c:v", "libtheora", "-c:a", "libvorbis"],
};

// Native FFmpeg: use faster encoding presets (VP9 default is extremely slow)
const NATIVE_CODEC_OVERRIDES: Record<string, string[]> = {
	webm: ["-c:v", "libvpx-vp9", "-cpu-used", "4", "-deadline", "good", "-row-mt", "1"],
	ogg: ["-c:v", "libtheora", "-c:a", "libvorbis"],
};

// Detect if running inside Electrobun's native webview
const isStandalone =
	typeof window !== "undefined" && "__electrobunSendToHost" in window;

// Helper to extract file extension
const getFileExt = (name: string): string =>
	(name.split(".").pop() || "mp4").toLowerCase();

// ── Bitrate Controls ──────────────────────────────────────────────

interface BitrateHandlerProps {
	bitrate: number;
	setBitrate: (value: number) => void;
	clipDuration: number;
	disabled: boolean;
}

const BitrateHandler = ({
	bitrate,
	setBitrate,
	clipDuration,
	disabled,
}: BitrateHandlerProps) => {
	const fileSizeMB =
		((bitrate + AUDIO_BITRATE_KBPS) * clipDuration) / 8192;

	const setFileSizeMB = (mb: number) =>
		setBitrate((mb * 8192) / (clipDuration || 1) - AUDIO_BITRATE_KBPS);

	return (
		<div
			className={`transition-opacity duration-200 ${
				disabled ? "opacity-40 pointer-events-none select-none" : ""
			}`}
		>
			<label className="block text-sm font-medium text-mocha-subtext0 mb-1">
				Video bitrate (kbps)
			</label>
			<input
				type="number"
				value={bitrate.toFixed(0)}
				onChange={(e) => setBitrate(parseFloat(e.target.value) || 0)}
				className="w-full border border-mocha-surface2 rounded px-3 py-2 text-sm text-mocha-text bg-mocha-surface0 focus:outline-none focus:ring-2 focus:ring-mocha-mauve focus:border-transparent disabled:cursor-not-allowed"
				min={100}
				max={50000}
				disabled={disabled}
			/>
			<label className="block text-sm font-medium text-mocha-subtext0 mb-1 mt-2">
				Target file size (MB)
			</label>
			<input
				type="number"
				value={fileSizeMB.toFixed(2)}
				onChange={(e) => setFileSizeMB(parseFloat(e.target.value) || 0)}
				className="w-full border border-mocha-surface2 rounded px-3 py-2 text-sm text-mocha-text bg-mocha-surface0 focus:outline-none focus:ring-2 focus:ring-mocha-mauve focus:border-transparent disabled:cursor-not-allowed"
				min={0.1}
				max={10000}
				disabled={disabled}
			/>
		</div>
	);
};

// ── File Drop Zone ────────────────────────────────────────────────

interface FileDropZoneProps {
	onFileSelect: (file: File) => void;
	onNativeBrowse?: () => void;
}

const FileDropZone = ({ onFileSelect, onNativeBrowse }: FileDropZoneProps) => {
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		// In standalone mode, always use native dialog (drop doesn't give us a file path)
		if (isStandalone && onNativeBrowse) {
			onNativeBrowse();
			return;
		}

		const file = e.dataTransfer.files[0];
		if (file && file.type.startsWith("video/")) {
			onFileSelect(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleClick = () => {
		// In standalone mode, always use native dialog
		if (isStandalone && onNativeBrowse) {
			onNativeBrowse();
			return;
		}
		fileInputRef.current?.click();
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) onFileSelect(file);
	};

	return (
		<div
			className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
				isDragging
					? "border-mocha-mauve bg-mocha-mauve/10 scale-[1.02]"
					: "border-mocha-surface2 hover:border-mocha-overlay0"
			}`}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragLeave={() => setIsDragging(false)}
			onClick={handleClick}
		>
			{/* Browser file input (only used in browser mode) */}
			{!isStandalone && (
				<input
					ref={fileInputRef}
					type="file"
					accept="video/*"
					className="hidden"
					onChange={handleInputChange}
				/>
			)}
			<div className="text-4xl mb-3">🎬</div>
			<p className="text-mocha-subtext1 font-medium">
				{isStandalone
					? "Click to select a video"
					: "Drop a video file here"}
			</p>
			<p className="text-mocha-overlay1 text-sm mt-1">
				{isStandalone
					? "or drop a video file here"
					: "or click to browse"}
			</p>
		</div>
	);
};

// ── Main App ──────────────────────────────────────────────────────

const App = () => {
	// File state
	const [videoSrc, setVideoSrc] = useState<string | null>(null);
	const [videoFile, setVideoFile] = useState<File | null>(null);
	const [nativeFilePath, setNativeFilePath] = useState<string | null>(null);
	const [sourceFormat, setSourceFormat] = useState("mp4");

	// Playback state
	const [position, setPosition] = useState(0);
	const [start, setStart] = useState(0);
	const [end, setEnd] = useState(1000);
	const [isPlaying, setIsPlaying] = useState(false);
	const [videoDuration, setVideoDuration] = useState(0);

	// Export state
	const [wasmLoaded, setWasmLoaded] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [exportProgress, setExportProgress] = useState(0);
	const [exportError, setExportError] = useState<string | null>(null);
	const [exportSuccess, setExportSuccess] = useState<string | null>(null);

	// Encoding options
	const [bitrate, setBitrate] = useState(1000);
	const [originalBitrate, setOriginalBitrate] = useState(1000);
	const [reencode, setReencode] = useState(false);
	const [outputFormat, setOutputFormat] = useState("mp4");

	// Resolution & framerate
	const [originalWidth, setOriginalWidth] = useState(1920);
	const [originalHeight, setOriginalHeight] = useState(1080);
	const [originalFps, setOriginalFps] = useState<number | null>(null);
	const [outputWidth, setOutputWidth] = useState(1920);
	const [outputHeight, setOutputHeight] = useState(1080);
	const [outputFps, setOutputFps] = useState<number | null>(null);
	const [lockAspectRatio, setLockAspectRatio] = useState(true);

	// Refs
	const ffmpegRef = useRef(new FFmpeg());
	const electroviewRef = useRef<any>(null);

	// ── Electrobun RPC init (standalone only) ─────────────────────

	useEffect(() => {
		if (!isStandalone) return;
		import("electrobun/view")
			.then(({ Electroview }: any) => {
				const rpc = Electroview.defineRPC<AppRPCType>({
					maxRequestTime: 600_000, // 10 min — native dialogs block
					handlers: { requests: {}, messages: {} },
				});
				electroviewRef.current = new Electroview({ rpc });
				console.log("[YAFW] Electrobun RPC initialized");
			})
			.catch((err: unknown) => {
				console.warn("[YAFW] Electrobun unavailable:", err);
			});
	}, []);

	// ── Video metadata detection ──────────────────────────────────

	const detectVideoMetadata = (src: string, fileSize?: number) => {
		const video = document.createElement("video");
		video.src = src;
		video.onloadedmetadata = () => {
			setVideoDuration(video.duration);
			setStart(0);
			setEnd(1000);
			setPosition(0);

			// Detect resolution
			const w = video.videoWidth || 1920;
			const h = video.videoHeight || 1080;
			setOriginalWidth(w);
			setOriginalHeight(h);
			setOutputWidth(w);
			setOutputHeight(h);

			const estimateBitrate = (bytes: number) => {
				if (video.duration <= 0) return;
				const totalKbps = (bytes * 8) / (video.duration * 1000);
				const videoKbps = Math.max(
					100,
					Math.round(totalKbps - AUDIO_BITRATE_KBPS),
				);
				setOriginalBitrate(videoKbps);
				setBitrate(videoKbps);
			};

			if (fileSize) {
				estimateBitrate(fileSize);
			} else {
				// Fallback: try HEAD request to get content-length
				fetch(src, { method: "HEAD" })
					.then((res) => {
						const cl = res.headers.get("content-length");
						if (cl) estimateBitrate(parseInt(cl));
					})
					.catch(() => {});
			}
		};
	};

	// ── File selection handlers ───────────────────────────────────

	const cleanupVideoSrc = () => {
		if (videoSrc && videoSrc.startsWith("blob:")) {
			URL.revokeObjectURL(videoSrc);
		}
	};

	// Handle file from <input> or drag & drop
	const handleFileSelect = (file: File) => {
		cleanupVideoSrc();
		const url = URL.createObjectURL(file);
		const ext = getFileExt(file.name);

		setOriginalFps(null);
		setOutputFps(null);
		setVideoSrc(url);
		setVideoFile(file);
		setNativeFilePath(null);
		setSourceFormat(ext);
		setOutputFormat(ext);
		setExportError(null);
		detectVideoMetadata(url, file.size);

		// Probe FPS/bitrate with WASM FFmpeg in the background
		probeWithWasm(file);
	};

	// Handle native file browse (standalone only)
	const handleNativeBrowse = async () => {
		console.log("[YAFW] handleNativeBrowse called");
		const ev = electroviewRef.current;
		if (!ev) {
			console.error("[YAFW] handleNativeBrowse: electroviewRef is null!");
			return;
		}

		try {
			console.log("[YAFW] Calling selectInputFile RPC...");
			const result = await ev.rpc.request.selectInputFile({});
			console.log("[YAFW] selectInputFile result:", result);

			if (!result.path) {
				console.log("[YAFW] No path returned, user cancelled");
				return;
			}

			cleanupVideoSrc();
			const previewUrl = `http://localhost:${result.previewPort}/`;
			const ext = getFileExt(result.path);

			console.log("[YAFW] Setting state:", { previewUrl, ext, path: result.path });

			setOriginalFps(null);
			setOutputFps(null);
			setVideoSrc(previewUrl);
			setVideoFile(null);
			setNativeFilePath(result.path);
			setSourceFormat(ext);
			setOutputFormat(ext);
			setExportError(null);
			setExportSuccess(null);
			detectVideoMetadata(previewUrl);

			// Probe FPS/bitrate with WASM FFmpeg using the localhost preview URL
			probeWithWasm(previewUrl, result.path);

			console.log("[YAFW] State set, editor should render");
		} catch (err) {
			console.error("[YAFW] handleNativeBrowse error:", err);
		}
	};

	// Reset to file selection screen
	const handleChangeVideo = () => {
		cleanupVideoSrc();
		setVideoSrc(null);
		setVideoFile(null);
		setNativeFilePath(null);
		setVideoDuration(0);
		setExportError(null);
	};

	// ── Playback position clamping ────────────────────────────────

	useEffect(() => {
		// Small tolerance for floating-point rounding
		if (position < start - 0.1) {
			if (position !== start) setPosition(start);
			setIsPlaying(false);
		} else if (position >= end) {
			if (position !== end) setPosition(end);
			setIsPlaying(false);
		}
	}, [position, start, end]);

	// ── Reset bitrate when re-encode toggled off ──────────────────

	useEffect(() => {
		if (!reencode) setBitrate(originalBitrate);
	}, [reencode, originalBitrate]);

	// ── WASM FFmpeg loader (browser path) ─────────────────────────

	const loadWasmFFmpeg = async () => {
		if (wasmLoaded) return;
		const ffmpeg = ffmpegRef.current;
		ffmpeg.on("log", ({ message }) =>
			console.log(`[FFmpeg WASM] ${message}`),
		);
		await ffmpeg.load({
			coreURL: await toBlobURL(
				`${WASM_FFMPEG_BASE_URL}/ffmpeg-core.js`,
				"text/javascript",
			),
			wasmURL: await toBlobURL(
				`${WASM_FFMPEG_BASE_URL}/ffmpeg-core.wasm`,
				"application/wasm",
			),
		});
		setWasmLoaded(true);
	};

	// ── Probe FPS with WASM FFmpeg (browser path) ──────────────────

	const probeWithWasm = async (source: File | string, fileName?: string) => {
		try {
			await loadWasmFFmpeg();
			const ffmpeg = ffmpegRef.current;

			// Collect log output
			const logs: string[] = [];
			const logHandler = ({ message }: { message: string }) => {
				logs.push(message);
			};
			ffmpeg.on("log", logHandler);

			// Write file to WASM virtual FS
			const name = typeof source === "string" ? (fileName || source) : source.name;
			const ext = getFileExt(name);
			const inputName = `probe_input.${ext}`;
			const data = await fetchFile(source);
			await ffmpeg.writeFile(inputName, data);

			// Run ffmpeg -i (will fail with exit code 1 since no output, but logs contain info)
			try {
				await ffmpeg.exec(["-i", inputName]);
			} catch {
				// Expected to fail — we only need the log output
			}

			// Clean up
			await ffmpeg.deleteFile(inputName);
			ffmpeg.off("log", logHandler);

			// Parse FPS from log lines like "Stream #0:0: Video: h264 ..., 29.97 fps, ..."
			const allLogs = logs.join("\n");
			console.log("[YAFW] WASM probe logs:", allLogs);

			let detectedFps = false;
			// Match "XX.XX fps" pattern
			const fpsMatch = allLogs.match(/(\d+(?:\.\d+)?)\s+fps/);
			if (fpsMatch) {
				const fps = parseFloat(fpsMatch[1]);
				if (fps > 0 && fps < 1000) {
					console.log(`[YAFW] WASM detected FPS: ${fps}`);
					setOriginalFps(fps);
					setOutputFps(fps);
					detectedFps = true;
				}
			}

			if (!detectedFps) {
				console.log("[YAFW] WASM probe did not detect FPS, falling back to 30");
				setOriginalFps(30);
				setOutputFps(30);
			}

			// Also try to parse bitrate from "bitrate: 1234 kb/s"
			const brMatch = allLogs.match(/bitrate:\s+(\d+)\s+kb\/s/);
			if (brMatch) {
				const br = parseInt(brMatch[1]);
				if (br > 0) {
					console.log(`[YAFW] WASM detected bitrate: ${br} kbps`);
					setOriginalBitrate(br);
					setBitrate(br);
				}
			}
		} catch (err) {
			console.warn("[YAFW] probeWithWasm failed:", err);
			setOriginalFps((current) => {
				if (current === null) {
					setOutputFps((outCurrent) => outCurrent === null ? 30 : outCurrent);
					return 30;
				}
				return current;
			});
		}
	};

	// ── Build FFmpeg arguments ────────────────────────────────────

	const buildFFmpegArgs = (): string[] => {
		const startTime = (start / 1000) * videoDuration;
		const endTime = (end / 1000) * videoDuration;
		const isConverting = outputFormat !== sourceFormat;

		const args: string[] = [
			"-ss", startTime.toString(),
			"-to", endTime.toString(),
		];

		const needsReencode = reencode || isConverting;

		if (needsReencode) {
			const br = reencode ? bitrate : originalBitrate;
			args.push(
				"-b:v", `${Math.round(br)}k`,
				"-maxrate", `${Math.round(br)}k`,
				"-bufsize", `${Math.round(br * 2)}k`,
			);

			// Resolution (only if changed from original or re-encoding)
			if (reencode && (outputWidth !== originalWidth || outputHeight !== originalHeight)) {
				// Ensure even dimensions (required by most codecs)
				const w = Math.round(outputWidth / 2) * 2;
				const h = Math.round(outputHeight / 2) * 2;
				args.push("-vf", `scale=${w}:${h}`);
			}

			// Framerate (only if changed from original)
			if (reencode && outputFps && originalFps && outputFps !== originalFps) {
				args.push("-r", outputFps.toString());
			}
		} else {
			// Same format, no re-encode — stream copy (fastest)
			args.push("-c", "copy");
		}

		return args;
	};

	// ── Export: native FFmpeg via Electrobun RPC ───────────────────

	const exportNative = async () => {
		const ev = electroviewRef.current;
		if (!ev || !nativeFilePath) {
			console.error("[YAFW] exportNative: no electroview or nativeFilePath", { ev: !!ev, nativeFilePath });
			throw new Error("Electrobun RPC or file path not available");
		}

		const args = buildFFmpegArgs();
		const codecOverrides = NATIVE_CODEC_OVERRIDES[outputFormat] ?? [];
		const fullArgs = [...args, ...codecOverrides];

		console.log("[YAFW] exportNative calling RPC...");
		console.log("[YAFW]   inputPath:", nativeFilePath);
		console.log("[YAFW]   outputExt:", outputFormat);
		console.log("[YAFW]   clipDuration:", clipDuration);
		console.log("[YAFW]   ffmpegArgs:", fullArgs.join(" "));

		const result = await ev.rpc.request.exportVideo({
			inputPath: nativeFilePath,
			ffmpegArgs: fullArgs,
			outputExt: outputFormat,
			clipDuration,
		});

		console.log("[YAFW] exportNative RPC result:", result);

		if (!result.success) {
			throw new Error(result.error || "Native FFmpeg export failed");
		}

		// Show success with output path
		setExportSuccess(result.outputPath || "Export complete");
	};

	// ── Export: WASM FFmpeg (browser fallback) ─────────────────────

	const exportWasm = async () => {
		await loadWasmFFmpeg();
		const ffmpeg = ffmpegRef.current;

		// Load video into WASM virtual filesystem
		const inputFilename = `input.${sourceFormat}`;
		if (videoFile) {
			const data = await videoFile.arrayBuffer();
			await ffmpeg.writeFile(inputFilename, new Uint8Array(data));
		} else if (videoSrc) {
			await ffmpeg.writeFile(inputFilename, await fetchFile(videoSrc));
		} else {
			throw new Error("No video file available");
		}

		const args = buildFFmpegArgs();
		const codecOverrides = WASM_CODEC_OVERRIDES[outputFormat] ?? [];
		const outputFilename = `output.${outputFormat}`;
		const fullArgs = [
			"-i", inputFilename,
			...args,
			...codecOverrides,
			outputFilename,
		];

		console.log(`[YAFW] WASM export: ffmpeg ${fullArgs.join(" ")}`);

		// Listen for WASM progress events
		const onProgress = ({ progress }: { progress: number }) => {
			setExportProgress(Math.max(0, Math.min(1, progress)));
		};
		ffmpeg.on("progress", onProgress);

		try {
			await ffmpeg.exec(fullArgs);
		} finally {
			ffmpeg.off("progress", onProgress);
		}

		const data = await ffmpeg.readFile(outputFilename);
		const mime =
			OUTPUT_FORMATS.find((f) => f.ext === outputFormat)?.mime ??
			"video/mp4";
		const blob = new Blob([(data as Uint8Array).buffer as ArrayBuffer], {
			type: mime,
		});

		// Trigger browser download
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `exported-video.${outputFormat}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	// ── Main export handler ───────────────────────────────────────

	const exportVideo = async () => {
		setExporting(true);
		setExportProgress(0);
		setExportError(null);
		setExportSuccess(null);
		try {
			const useNative =
				isStandalone && nativeFilePath && electroviewRef.current;
			if (useNative) {
				await exportNative();
			} else {
				await exportWasm();
			}
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			setExportError(msg);
			console.error("[YAFW] Export failed:", error);
		} finally {
			setExporting(false);
			setExportProgress(0);
		}
	};

	// ── Derived state ─────────────────────────────────────────────

	const isConverting = outputFormat !== sourceFormat;
	const clipDuration = ((end - start) / 1000) * videoDuration;
	const useNativeExport = isStandalone && !!nativeFilePath && !!electroviewRef.current;

	// ── Poll native export progress ──────────────────────────────

	useEffect(() => {
		if (!exporting || !useNativeExport) return;
		const ev = electroviewRef.current;
		if (!ev) return;

		const interval = setInterval(async () => {
			try {
				const { progress } = await ev.rpc.request.getExportProgress({});
				setExportProgress(progress);
			} catch {}
		}, 300);

		return () => clearInterval(interval);
	}, [exporting, useNativeExport]);

	// ── Render: file selection screen ─────────────────────────────

	if (!videoSrc) {
		return (
			<div className="flex flex-col items-center justify-center p-8 bg-mocha-base min-h-screen text-mocha-text">
				<div className="bg-mocha-surface0 p-6 rounded-xl shadow-lg w-full max-w-xl">
					<h1 className="text-xl font-bold text-mocha-text mb-1 text-center">
						YAFW
					</h1>
					<p className="text-sm text-mocha-subtext0 text-center mb-6">
						Yet Another FFmpeg Wrapper
					</p>
					<FileDropZone
						onFileSelect={handleFileSelect}
						onNativeBrowse={
							isStandalone ? handleNativeBrowse : undefined
						}
					/>
				</div>
			</div>
		);
	}

	// ── Render: editor ────────────────────────────────────────────

	return (
		<div className="flex flex-col items-center justify-center p-8 bg-mocha-base min-h-screen text-mocha-text">
			<div className="bg-mocha-surface0 p-6 rounded-xl shadow-lg w-full max-w-xl">
				<Player
					videoSrc={videoSrc}
					positionState={{ position, setPosition }}
					isPlayingState={{ isPlaying, setIsPlaying }}
					startState={{ start, setStart }}
					endState={{ end, setEnd }}
				/>

				<Timeline
					startState={{ start, setStart }}
					endState={{ end, setEnd }}
					setPosition={setPosition}
				/>

				{/* Re-encode toggle */}
				<div className="mt-4 flex items-center gap-3">
					<button
						type="button"
						role="switch"
						aria-checked={reencode}
						onClick={() => setReencode(!reencode)}
						className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-mocha-mauve focus:ring-offset-2 focus:ring-offset-mocha-surface0 ${
							reencode ? "bg-mocha-mauve" : "bg-mocha-surface2"
						}`}
					>
						<span
							className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-mocha-text shadow ring-0 transition duration-200 ease-in-out ${
								reencode ? "translate-x-5" : "translate-x-0"
							}`}
						/>
					</button>
					<span className="text-sm font-medium text-mocha-subtext1">
						Re-encode video
					</span>
				</div>

				{/* Output format selector */}
				<div className="mt-3">
					<label
						htmlFor="format-select"
						className="block text-sm font-medium text-mocha-subtext0 mb-1"
					>
						Output format
					</label>
					<select
						id="format-select"
						value={outputFormat}
						onChange={(e) => setOutputFormat(e.target.value)}
						className="w-full border border-mocha-surface2 rounded px-3 py-2 text-sm text-mocha-text bg-mocha-surface0 focus:outline-none focus:ring-2 focus:ring-mocha-mauve focus:border-transparent appearance-none cursor-pointer"
					>
						{OUTPUT_FORMATS.map((fmt) => (
							<option key={fmt.ext} value={fmt.ext}>
								{fmt.label}
							</option>
						))}
					</select>
					{isConverting && (
						<p className="text-xs text-mocha-peach italic mt-1">
							Format conversion requires re-encoding
						</p>
					)}
				</div>

				{/* Bitrate controls (disabled when re-encode is off) */}
				<div className="mt-3">
					<BitrateHandler
						bitrate={bitrate}
						setBitrate={setBitrate}
						clipDuration={clipDuration}
						disabled={!reencode}
					/>
				</div>

				{/* Resolution controls */}
				<div className={`mt-3 ${!reencode ? 'opacity-50 pointer-events-none' : ''}`}>
					<label className="block text-sm font-medium text-mocha-subtext0 mb-1">
						Resolution
					</label>
					<div className="flex items-center gap-2">
						<input
							type="number"
							value={outputWidth}
							onChange={(e) => {
								const w = parseInt(e.target.value) || originalWidth;
								setOutputWidth(w);
								if (lockAspectRatio && originalWidth > 0) {
									setOutputHeight(Math.round(w * (originalHeight / originalWidth)));
								}
							}}
							disabled={!reencode}
							className="w-24 border border-mocha-surface2 rounded px-2 py-1.5 text-sm text-mocha-text bg-mocha-surface0 focus:outline-none focus:ring-2 focus:ring-mocha-mauve disabled:opacity-50"
						/>
						<span className="text-mocha-overlay1 text-sm">×</span>
						<input
							type="number"
							value={outputHeight}
							onChange={(e) => {
								const h = parseInt(e.target.value) || originalHeight;
								setOutputHeight(h);
								if (lockAspectRatio && originalHeight > 0) {
									setOutputWidth(Math.round(h * (originalWidth / originalHeight)));
								}
							}}
							disabled={!reencode}
							className="w-24 border border-mocha-surface2 rounded px-2 py-1.5 text-sm text-mocha-text bg-mocha-surface0 focus:outline-none focus:ring-2 focus:ring-mocha-mauve disabled:opacity-50"
						/>
						<button
							onClick={() => setLockAspectRatio(!lockAspectRatio)}
							disabled={!reencode}
							className={`p-1.5 rounded text-sm transition-colors ${
								lockAspectRatio
									? 'bg-mocha-mauve/20 text-mocha-mauve'
									: 'bg-mocha-surface1 text-mocha-overlay1'
							} hover:bg-mocha-mauve/30 disabled:opacity-50`}
							title={lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
						>
							{lockAspectRatio ? '🔗' : '🔓'}
						</button>
						<button
							onClick={() => {
								setOutputWidth(originalWidth);
								setOutputHeight(originalHeight);
							}}
							disabled={!reencode || (outputWidth === originalWidth && outputHeight === originalHeight)}
							className="px-2 py-1.5 rounded text-xs bg-mocha-surface1 text-mocha-subtext0 hover:bg-mocha-surface2 transition-colors disabled:opacity-30"
							title="Reset to original resolution"
						>
							Reset
						</button>
					</div>
					<p className="text-xs text-mocha-overlay0 mt-0.5">
						Original: {originalWidth}×{originalHeight}
					</p>
				</div>

				{/* Framerate control */}
				<div className={`mt-3 ${!reencode ? 'opacity-50 pointer-events-none' : ''}`}>
					<label className="block text-sm font-medium text-mocha-subtext0 mb-1">
						Framerate (FPS)
					</label>
					<div className="flex items-center gap-2">
						{originalFps === null ? (
							<div className="flex items-center gap-2 py-1.5">
								<svg className="animate-spin h-4 w-4 text-mocha-mauve" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<span className="text-xs text-mocha-subtext0 font-medium">Detecting framerate...</span>
							</div>
						) : (
							<>
								<input
									type="number"
									value={outputFps ?? ""}
									min={1}
									max={240}
									onChange={(e) => setOutputFps(Math.max(1, parseInt(e.target.value) || originalFps || 30))}
									disabled={!reencode}
									className="w-24 border border-mocha-surface2 rounded px-2 py-1.5 text-sm text-mocha-text bg-mocha-surface0 focus:outline-none focus:ring-2 focus:ring-mocha-mauve disabled:opacity-50"
								/>
								<span className="text-mocha-overlay1 text-xs">fps</span>
								<button
									type="button"
									onClick={() => setOutputFps(originalFps)}
									disabled={!reencode || outputFps === originalFps}
									className="px-2 py-1.5 rounded text-xs bg-mocha-surface1 text-mocha-subtext0 hover:bg-mocha-surface2 transition-colors disabled:opacity-30"
									title="Reset to original framerate"
								>
									Reset
								</button>
							</>
						)}
					</div>
					<p className="text-xs text-mocha-overlay0 mt-0.5">
						Original: {originalFps !== null ? `${originalFps} fps` : "detecting..."}
					</p>
				</div>

				{/* Export error */}
				{exportError && (
					<div className="mt-3 p-3 bg-mocha-red/10 border border-mocha-red/30 rounded text-sm text-mocha-red">
						Export failed: {exportError}
					</div>
				)}

				{/* Export success */}
				{exportSuccess && (
					<div className="mt-3 p-3 bg-mocha-green/10 border border-mocha-green/30 rounded text-sm text-mocha-green">
						✅ Saved to: {exportSuccess}
					</div>
				)}

				{/* Progress bar */}
				{exporting && (
					<div className="mt-3">
						<div className="w-full h-2 bg-mocha-surface2 rounded-full overflow-hidden">
							<div
								className="h-full bg-mocha-mauve rounded-full transition-all duration-300 ease-out"
								style={{ width: `${Math.round(exportProgress * 100)}%` }}
							/>
						</div>
						<p className="text-xs text-mocha-subtext0 mt-1 text-center">
							{Math.round(exportProgress * 100)}%
						</p>
					</div>
				)}

				{/* Export section */}
				<div className="mt-4 flex justify-between items-center">
					<p className="text-sm text-mocha-subtext0">
						Export from{" "}
						{((start / 1000) * videoDuration).toFixed(2)}s to{" "}
						{((end / 1000) * videoDuration).toFixed(2)}s
					</p>
					<button
						onClick={exportVideo}
						disabled={exporting}
						className="bg-mocha-mauve text-mocha-crust px-4 py-2 rounded hover:brightness-110 disabled:opacity-50 font-bold transition-all"
					>
						{exporting
							? "Exporting..."
							: `Export as .${outputFormat}`}
					</button>
				</div>

				{/* Footer: runtime info + change video */}
				<div className="mt-3 flex justify-between items-center">
					{useNativeExport ? (
						<span className="text-xs text-mocha-overlay1">
							⚡ Using native FFmpeg
						</span>
					) : (
						<span />
					)}
					<button
						onClick={handleChangeVideo}
						className="text-xs text-mocha-overlay1 hover:text-mocha-text transition-colors"
					>
						📁 Change video
					</button>
				</div>
			</div>
		</div>
	);
};

export default App;
