import { Player } from "./Player";
import { Timeline } from "./Timeline";
import { EncoderSettings } from "./EncoderSettings";
import { ExportPanel } from "./ExportPanel";

interface OutputFormat {
	readonly label: string;
	readonly ext: string;
	readonly mime: string;
}

interface EditorPageProps {
	// Video & playback
	videoSrc: string;
	position: number;
	setPosition: (value: number) => void;
	isPlaying: boolean;
	setIsPlaying: (value: boolean) => void;
	start: number;
	setStart: (value: number) => void;
	end: number;
	setEnd: (value: number) => void;
	videoDuration: number;

	// Encoder settings
	reencode: boolean;
	setReencode: (value: boolean) => void;
	outputFormat: string;
	setOutputFormat: (value: string) => void;
	outputFormats: readonly OutputFormat[];
	isConverting: boolean;
	bitrate: number;
	setBitrate: (value: number) => void;
	clipDuration: number;
	outputWidth: number;
	setOutputWidth: (value: number) => void;
	outputHeight: number;
	setOutputHeight: (value: number) => void;
	originalWidth: number;
	originalHeight: number;
	lockAspectRatio: boolean;
	setLockAspectRatio: (value: boolean) => void;
	originalFps: number | null;
	outputFps: number | null;
	setOutputFps: (value: number | null) => void;
	useNativeExport: boolean;
	hasHwAccSupport: boolean;
	hwAcc: boolean;
	setHwAcc: (value: boolean) => void;

	// Export
	exporting: boolean;
	exportProgress: number;
	exportError: string | null;
	exportSuccess: string | null;
	onExport: () => void;
}

export const EditorPage = ({
	videoSrc,
	position,
	setPosition,
	isPlaying,
	setIsPlaying,
	start,
	setStart,
	end,
	setEnd,
	videoDuration,
	reencode,
	setReencode,
	outputFormat,
	setOutputFormat,
	outputFormats,
	isConverting,
	bitrate,
	setBitrate,
	clipDuration,
	outputWidth,
	setOutputWidth,
	outputHeight,
	setOutputHeight,
	originalWidth,
	originalHeight,
	lockAspectRatio,
	setLockAspectRatio,
	originalFps,
	outputFps,
	setOutputFps,
	useNativeExport,
	hasHwAccSupport,
	hwAcc,
	setHwAcc,
	exporting,
	exportProgress,
	exportError,
	exportSuccess,
	onExport,
}: EditorPageProps) => (
	<main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 max-w-7xl w-full mx-auto relative z-10">
		{/* Left column: Player + Timeline */}
		<div className="flex-1 flex flex-col gap-6">
			<Player
				videoSrc={videoSrc}
				positionState={{ position, setPosition }}
				isPlayingState={{ isPlaying, setIsPlaying }}
				startState={{ start, setStart }}
				endState={{ end, setEnd }}
				videoDuration={videoDuration}
			/>

			<div className="bg-mocha-surface0 rounded-xl p-5 border border-mocha-surface0 shadow-lg">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-mocha-subtext0 mb-4 select-none">
					Timeline & Trim Controls
				</h3>
				<Timeline
					startState={{ start, setStart }}
					endState={{ end, setEnd }}
					positionState={{ position, setPosition }}
					videoDuration={videoDuration}
				/>
			</div>
		</div>

		{/* Right column: Encoder & Export Settings Sidebar */}
		<div className="w-full lg:w-80 flex flex-col gap-6">
			<EncoderSettings
				reencode={reencode}
				setReencode={setReencode}
				outputFormat={outputFormat}
				setOutputFormat={setOutputFormat}
				outputFormats={outputFormats}
				isConverting={isConverting}
				bitrate={bitrate}
				setBitrate={setBitrate}
				clipDuration={clipDuration}
				outputWidth={outputWidth}
				setOutputWidth={setOutputWidth}
				outputHeight={outputHeight}
				setOutputHeight={setOutputHeight}
				originalWidth={originalWidth}
				originalHeight={originalHeight}
				lockAspectRatio={lockAspectRatio}
				setLockAspectRatio={setLockAspectRatio}
				originalFps={originalFps}
				outputFps={outputFps}
				setOutputFps={setOutputFps}
				useNativeExport={useNativeExport}
				hasHwAccSupport={hasHwAccSupport}
				hwAcc={hwAcc}
				setHwAcc={setHwAcc}
			/>

			<ExportPanel
				start={start}
				end={end}
				videoDuration={videoDuration}
				outputFormat={outputFormat}
				exporting={exporting}
				exportProgress={exportProgress}
				exportError={exportError}
				exportSuccess={exportSuccess}
				useNativeExport={useNativeExport}
				onExport={onExport}
			/>
		</div>
	</main>
);
