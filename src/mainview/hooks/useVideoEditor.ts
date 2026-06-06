import { useEffect, useState } from "react";
import { useElectrobun } from "./useElectrobun";
import { useFFmpeg } from "./useFFmpeg";
import { getFileExt, getBestH264Encoder, getBestVP9Encoder } from "../helpers";
import { AUDIO_BITRATE_KBPS, NATIVE_CODEC_OVERRIDES } from "../constants";

export const useVideoEditor = () => {
	const { electroview, supportedEncoders, isStandalone } = useElectrobun();
	const { wasmLoaded, loadWasmFFmpeg, probeWithWasm, exportWasm } = useFFmpeg();

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
	const [exporting, setExporting] = useState(false);
	const [exportProgress, setExportProgress] = useState(0);
	const [exportError, setExportError] = useState<string | null>(null);
	const [exportSuccess, setExportSuccess] = useState<string | null>(null);

	const [currentPage, setCurrentPage] = useState<"editor" | "download">("editor");

	// Encoding options
	const [bitrate, setBitrate] = useState(1000);
	const [originalBitrate, setOriginalBitrate] = useState(1000);
	const [reencode, setReencode] = useState(false);
	const [outputFormat, setOutputFormat] = useState("mp4");
	const [hwAcc, setHwAcc] = useState(true);

	// Resolution & framerate
	const [originalWidth, setOriginalWidth] = useState(1920);
	const [originalHeight, setOriginalHeight] = useState(1080);
	const [originalFps, setOriginalFps] = useState<number | null>(null);
	const [outputWidth, setOutputWidth] = useState(1920);
	const [outputHeight, setOutputHeight] = useState(1080);
	const [outputFps, setOutputFps] = useState<number | null>(null);
	const [lockAspectRatio, setLockAspectRatio] = useState(true);

	// Derived state
	const isConverting = outputFormat !== sourceFormat;
	const clipDuration = ((end - start) / 1000) * videoDuration;
	const useNativeExport = isStandalone && !!nativeFilePath && !!electroview;

	const hasHwAccSupport =
		["mp4", "mkv", "mov", "flv", "ts"].includes(outputFormat)
			? !!getBestH264Encoder(supportedEncoders)
			: outputFormat === "webm"
			? !!getBestVP9Encoder(supportedEncoders)
			: false;

	// Clamping playback position
	useEffect(() => {
		if (position < start - 0.1) {
			if (position !== start) setPosition(start);
			setIsPlaying(false);
		} else if (position >= end) {
			if (position !== end) setPosition(end);
			setIsPlaying(false);
		}
	}, [position, start, end]);

	// Reset bitrate when re-encode toggled off
	useEffect(() => {
		if (!reencode) setBitrate(originalBitrate);
	}, [reencode, originalBitrate]);

	// Poll native export progress
	useEffect(() => {
		if (!exporting || !useNativeExport || !electroview) return;

		const interval = setInterval(async () => {
			try {
				const { progress } = await electroview.rpc.request.getExportProgress({});
				setExportProgress(progress);
			} catch {}
		}, 300);

		return () => clearInterval(interval);
	}, [exporting, useNativeExport, electroview]);

	const detectVideoMetadata = (src: string, fileSize?: number) => {
		const video = document.createElement("video");
		video.src = src;
		video.onloadedmetadata = () => {
			setVideoDuration(video.duration);
			setStart(0);
			setEnd(1000);
			setPosition(0);

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
					Math.round(totalKbps - AUDIO_BITRATE_KBPS)
				);
				setOriginalBitrate(videoKbps);
				setBitrate(videoKbps);
			};

			if (fileSize) {
				estimateBitrate(fileSize);
			} else {
				fetch(src, { method: "HEAD" })
					.then((res) => {
						const cl = res.headers.get("content-length");
						if (cl) estimateBitrate(parseInt(cl));
					})
					.catch(() => {});
			}
		};
	};

	const cleanupVideoSrc = () => {
		if (videoSrc && videoSrc.startsWith("blob:")) {
			URL.revokeObjectURL(videoSrc);
		}
	};

	const handleFileSelect = async (file: File) => {
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

		const probed = await probeWithWasm(file);
		if (probed.fps !== null) {
			setOriginalFps(probed.fps);
			setOutputFps(probed.fps);
		} else {
			setOriginalFps(30);
			setOutputFps(30);
		}
		if (probed.bitrate !== null) {
			setOriginalBitrate(probed.bitrate);
			setBitrate(probed.bitrate);
		}
	};

	const handleNativeBrowse = async () => {
		console.log("[YAFW] handleNativeBrowse called");
		if (!electroview) {
			console.error("[YAFW] handleNativeBrowse: electroview is null!");
			return;
		}

		try {
			console.log("[YAFW] Calling selectInputFile RPC...");
			const result = await electroview.rpc.request.selectInputFile({});
			console.log("[YAFW] selectInputFile result:", result);

			if (!result.path) {
				console.log("[YAFW] No path returned, user cancelled");
				return;
			}

			cleanupVideoSrc();
			const previewUrl = `http://localhost:${result.previewPort}/`;
			const ext = getFileExt(result.path);

			setOriginalFps(null);
			setOutputFps(null);
			setVideoSrc(previewUrl);
			setVideoFile(null);
			setNativeFilePath(result.path);
			setSourceFormat(ext);
			setOutputFormat(ext);
			setExportError(null);
			setExportSuccess(null);

			console.log("[YAFW] Calling native probeVideo RPC...");
			const probed = await electroview.rpc.request.probeVideo({ inputPath: result.path });
			console.log("[YAFW] native probeVideo result:", probed);

			// Initialize metadata states directly from native probe values
			const duration = probed.duration || 0;
			setVideoDuration(duration);
			setStart(0);
			setEnd(1000);
			setPosition(0);

			const w = probed.width || 1920;
			const h = probed.height || 1080;
			setOriginalWidth(w);
			setOriginalHeight(h);
			setOutputWidth(w);
			setOutputHeight(h);

			if (probed.fps) {
				setOriginalFps(probed.fps);
				setOutputFps(probed.fps);
			} else {
				setOriginalFps(30);
				setOutputFps(30);
			}

			if (probed.bitrate) {
				setOriginalBitrate(probed.bitrate);
				setBitrate(probed.bitrate);
			} else {
				setOriginalBitrate(1000);
				setBitrate(1000);
			}
		} catch (err) {
			console.error("[YAFW] handleNativeBrowse error:", err);
		}
	};

	const handleChangeVideo = () => {
		cleanupVideoSrc();
		setVideoSrc(null);
		setVideoFile(null);
		setNativeFilePath(null);
		setVideoDuration(0);
		setExportError(null);
		setExportSuccess(null);
	};

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

			if (reencode && (outputWidth !== originalWidth || outputHeight !== originalHeight)) {
				const w = Math.round(outputWidth / 2) * 2;
				const h = Math.round(outputHeight / 2) * 2;
				args.push("-vf", `scale=${w}:${h}`);
			}

			if (reencode && outputFps && originalFps && outputFps !== originalFps) {
				args.push("-r", outputFps.toString());
			}
		} else {
			args.push("-c", "copy");
		}

		return args;
	};

	const exportNative = async () => {
		if (!electroview || !nativeFilePath) {
			throw new Error("Electrobun RPC or file path not available");
		}

		const args = buildFFmpegArgs();
		const needsReencode = reencode || (outputFormat !== sourceFormat);

		let codecOverrides = [...(NATIVE_CODEC_OVERRIDES[outputFormat] ?? [])];
		if (needsReencode && hwAcc) {
			if (["mp4", "mkv", "mov", "flv", "ts"].includes(outputFormat)) {
				const h264Encoder = getBestH264Encoder(supportedEncoders);
				if (h264Encoder) {
					codecOverrides = ["-c:v", h264Encoder];
				}
			} else if (outputFormat === "webm") {
				const vp9Encoder = getBestVP9Encoder(supportedEncoders);
				if (vp9Encoder) {
					codecOverrides = ["-c:v", vp9Encoder];
				}
			}
		}

		const fullArgs = [...args, ...codecOverrides];

		const result = await electroview.rpc.request.exportVideo({
			inputPath: nativeFilePath,
			ffmpegArgs: fullArgs,
			outputExt: outputFormat,
			clipDuration,
		});

		if (!result.success) {
			throw new Error(result.error || "Native FFmpeg export failed");
		}

		setExportSuccess(result.outputPath || "Export complete");
	};

	const exportVideo = async () => {
		setExporting(true);
		setExportProgress(0);
		setExportError(null);
		setExportSuccess(null);
		try {
			const useNative = isStandalone && nativeFilePath && electroview;
			if (useNative) {
				await exportNative();
			} else {
				const args = buildFFmpegArgs();
				await exportWasm(
					sourceFormat,
					outputFormat,
					videoFile,
					videoSrc,
					args,
					(progress) => setExportProgress(progress)
				);
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

	return {
		videoSrc,
		videoFile,
		nativeFilePath,
		sourceFormat,
		position,
		setPosition,
		start,
		setStart,
		end,
		setEnd,
		isPlaying,
		setIsPlaying,
		videoDuration,
		exporting,
		exportProgress,
		exportError,
		exportSuccess,
		currentPage,
		setCurrentPage,
		bitrate,
		setBitrate,
		originalBitrate,
		reencode,
		setReencode,
		outputFormat,
		setOutputFormat,
		hwAcc,
		setHwAcc,
		originalWidth,
		originalHeight,
		originalFps,
		outputWidth,
		setOutputWidth,
		outputHeight,
		setOutputHeight,
		lockAspectRatio,
		setLockAspectRatio,
		outputFps,
		setOutputFps,
		isConverting,
		clipDuration,
		useNativeExport,
		hasHwAccSupport,
		handleFileSelect,
		handleNativeBrowse,
		handleChangeVideo,
		exportVideo,
		isStandalone,
	};
};
