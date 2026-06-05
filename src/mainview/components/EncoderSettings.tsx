import { ToggleSwitch } from "./ToggleSwitch";
import { BitrateHandler } from "./BitrateHandler";

interface OutputFormat {
	readonly label: string;
	readonly ext: string;
	readonly mime: string;
}

interface EncoderSettingsProps {
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
}

export const EncoderSettings = ({
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
}: EncoderSettingsProps) => (
	<div className="bg-mocha-surface0 rounded-xl p-5 border border-mocha-surface0 shadow-lg flex flex-col gap-4">
		<h2 className="text-sm font-bold uppercase tracking-wider text-mocha-subtext0 border-b border-mocha-surface1 pb-2">
			Encoder Settings
		</h2>

		{/* Re-encode toggle */}
		<div className="flex items-center justify-between bg-mocha-mantle/50 p-3 rounded-lg border border-mocha-surface1">
			<div className="flex flex-col">
				<span className="text-xs font-bold text-mocha-text">Re-encode Video</span>
				<span className="text-[10px] text-mocha-subtext0">Required for custom settings</span>
			</div>
			<ToggleSwitch
				checked={reencode}
				onChange={() => setReencode(!reencode)}
			/>
		</div>

		{/* Hardware Acceleration toggle (desktop standalone only) */}
		{useNativeExport && (
			<div className={`flex items-center justify-between bg-mocha-mantle/50 p-3 rounded-lg border border-mocha-surface1 transition-all ${!hasHwAccSupport ? "opacity-50" : ""}`}>
				<div className="flex flex-col">
					<span className="text-xs font-bold text-mocha-text">Hardware Acceleration</span>
					<span className="text-[10px] text-mocha-subtext0">
						{hasHwAccSupport ? "Speeds up encoding using GPU" : "No compatible GPU encoder detected"}
					</span>
				</div>
				<ToggleSwitch
					checked={hwAcc && hasHwAccSupport}
					onChange={() => setHwAcc(!hwAcc)}
					disabled={!hasHwAccSupport}
				/>
			</div>
		)}

		{/* Output format selector */}
		<div>
			<label
				htmlFor="format-select"
				className="block text-xs font-bold text-mocha-subtext0 mb-1"
			>
				Output Format
			</label>
			<div className="relative">
				<select
					id="format-select"
					value={outputFormat}
					onChange={(e) => setOutputFormat(e.target.value)}
					className="w-full border border-mocha-surface2 rounded-lg px-3 py-2 text-xs text-mocha-text bg-mocha-surface0 focus:outline-none focus:ring-2 focus:ring-mocha-mauve focus:border-transparent appearance-none cursor-pointer"
				>
					{outputFormats.map((fmt) => (
						<option key={fmt.ext} value={fmt.ext}>
							{fmt.label}
						</option>
					))}
				</select>
				<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-mocha-subtext0 text-xs">
					▼
				</div>
			</div>
			{isConverting && (
				<p className="text-[10px] text-mocha-peach italic mt-1">
					Format conversion requires re-encoding
				</p>
			)}
		</div>

		{/* Bitrate controls */}
		<div className="border-t border-mocha-surface1 pt-3">
			<BitrateHandler
				bitrate={bitrate}
				setBitrate={setBitrate}
				clipDuration={clipDuration}
				disabled={!reencode}
			/>
		</div>

		{/* Resolution controls */}
		<div className={`border-t border-mocha-surface1 pt-3 ${!reencode ? 'opacity-50 pointer-events-none' : ''}`}>
			<label className="block text-xs font-bold text-mocha-subtext0 mb-1">
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
					className="w-full border border-mocha-surface2 rounded-lg px-2.5 py-1.5 text-xs text-mocha-text bg-mocha-surface0 focus:outline-none focus:ring-2 focus:ring-mocha-mauve disabled:opacity-50"
				/>
				<span className="text-mocha-overlay1 text-sm select-none">×</span>
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
					className="w-full border border-mocha-surface2 rounded-lg px-2.5 py-1.5 text-xs text-mocha-text bg-mocha-surface0 focus:outline-none focus:ring-2 focus:ring-mocha-mauve disabled:opacity-50"
				/>
				<button
					onClick={() => setLockAspectRatio(!lockAspectRatio)}
					disabled={!reencode}
					className={`p-1.5 rounded-lg text-xs transition-colors ${
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
					className="px-2 py-1.5 rounded-lg text-[10px] font-semibold bg-mocha-surface1 text-mocha-subtext0 hover:bg-mocha-surface2 transition-colors disabled:opacity-30"
					title="Reset to original resolution"
				>
					Reset
				</button>
			</div>
			<p className="text-[10px] text-mocha-overlay0 mt-1 select-none">
				Original: {originalWidth}×{originalHeight}
			</p>
		</div>

		{/* Framerate control */}
		<div className={`border-t border-mocha-surface1 pt-3 ${!reencode ? 'opacity-50 pointer-events-none' : ''}`}>
			<label className="block text-xs font-bold text-mocha-subtext0 mb-1">
				Framerate (FPS)
			</label>
			<div className="flex items-center gap-2">
				{originalFps === null ? (
					<div className="flex items-center gap-2 py-1.5">
						<svg className="animate-spin h-3.5 w-3.5 text-mocha-mauve" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span className="text-[10px] text-mocha-subtext0 font-medium">Detecting...</span>
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
							className="w-full border border-mocha-surface2 rounded-lg px-2.5 py-1.5 text-xs text-mocha-text bg-mocha-surface0 focus:outline-none focus:ring-2 focus:ring-mocha-mauve disabled:opacity-50"
						/>
						<span className="text-mocha-overlay1 text-xs select-none">fps</span>
						<button
							type="button"
							onClick={() => setOutputFps(originalFps)}
							disabled={!reencode || outputFps === originalFps}
							className="px-2 py-1.5 rounded-lg text-[10px] font-semibold bg-mocha-surface1 text-mocha-subtext0 hover:bg-mocha-surface2 transition-colors disabled:opacity-30"
							title="Reset to original framerate"
						>
							Reset
						</button>
					</>
				)}
			</div>
			<p className="text-[10px] text-mocha-overlay0 mt-1 select-none">
				Original: {originalFps !== null ? `${originalFps} fps` : "detecting..."}
			</p>
		</div>
	</div>
);
