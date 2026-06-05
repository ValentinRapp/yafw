import { useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { WASM_FFMPEG_BASE_URL, WASM_CODEC_OVERRIDES, OUTPUT_FORMATS } from "../constants";
import { getFileExt } from "../helpers";

export const useFFmpeg = () => {
	const [wasmLoaded, setWasmLoaded] = useState(false);
	const ffmpegRef = useRef(new FFmpeg());

	const loadWasmFFmpeg = async () => {
		if (wasmLoaded) return;
		const ffmpeg = ffmpegRef.current;
		ffmpeg.on("log", ({ message }) =>
			console.log(`[FFmpeg WASM] ${message}`)
		);
		await ffmpeg.load({
			coreURL: await toBlobURL(
				`${WASM_FFMPEG_BASE_URL}/ffmpeg-core.js`,
				"text/javascript"
			),
			wasmURL: await toBlobURL(
				`${WASM_FFMPEG_BASE_URL}/ffmpeg-core.wasm`,
				"application/wasm"
			),
		});
		setWasmLoaded(true);
	};

	const probeWithWasm = async (
		source: File | string,
		fileName?: string
	): Promise<{ fps: number | null; bitrate: number | null }> => {
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
			const name = typeof source === "string" ? fileName || source : source.name;
			const ext = getFileExt(name);
			const inputName = `probe_input.${ext}`;
			const data = await fetchFile(source);
			await ffmpeg.writeFile(inputName, data);

			// Run ffmpeg -i
			try {
				await ffmpeg.exec(["-i", inputName]);
			} catch {
				// Expected to fail since no output specified
			}

			// Clean up
			await ffmpeg.deleteFile(inputName);
			ffmpeg.off("log", logHandler);

			const allLogs = logs.join("\n");
			console.log("[YAFW] WASM probe logs:", allLogs);

			let detectedFps: number | null = null;
			const fpsMatch = allLogs.match(/(\d+(?:\.\d+)?)\s+fps/);
			if (fpsMatch) {
				const fpsValue = parseFloat(fpsMatch[1]);
				if (fpsValue > 0 && fpsValue < 1000) {
					console.log(`[YAFW] WASM detected FPS: ${fpsValue}`);
					detectedFps = fpsValue;
				}
			}

			let detectedBitrate: number | null = null;
			const brMatch = allLogs.match(/bitrate:\s+(\d+)\s+kb\/s/);
			if (brMatch) {
				const brValue = parseInt(brMatch[1]);
				if (brValue > 0) {
					console.log(`[YAFW] WASM detected bitrate: ${brValue} kbps`);
					detectedBitrate = brValue;
				}
			}

			return { fps: detectedFps, bitrate: detectedBitrate };
		} catch (err) {
			console.warn("[YAFW] probeWithWasm failed:", err);
			return { fps: null, bitrate: null };
		}
	};

	const exportWasm = async (
		sourceFormat: string,
		outputFormat: string,
		videoFile: File | null,
		videoSrc: string | null,
		ffmpegArgs: string[],
		onProgress: (progress: number) => void
	) => {
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

		const codecOverrides = WASM_CODEC_OVERRIDES[outputFormat] ?? [];
		const outputFilename = `output.${outputFormat}`;
		const fullArgs = [
			"-i",
			inputFilename,
			...ffmpegArgs,
			...codecOverrides,
			outputFilename,
		];

		console.log(`[YAFW] WASM export: ffmpeg ${fullArgs.join(" ")}`);

		const progressHandler = ({ progress }: { progress: number }) => {
			onProgress(Math.max(0, Math.min(1, progress)));
		};
		ffmpeg.on("progress", progressHandler);

		try {
			await ffmpeg.exec(fullArgs);
		} finally {
			ffmpeg.off("progress", progressHandler);
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

	return {
		wasmLoaded,
		loadWasmFFmpeg,
		probeWithWasm,
		exportWasm,
	};
};
