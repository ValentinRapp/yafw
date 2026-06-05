interface ExportPanelProps {
	start: number;
	end: number;
	videoDuration: number;
	outputFormat: string;
	exporting: boolean;
	exportProgress: number;
	exportError: string | null;
	exportSuccess: string | null;
	useNativeExport: boolean;
	onExport: () => void;
}

export const ExportPanel = ({
	start,
	end,
	videoDuration,
	outputFormat,
	exporting,
	exportProgress,
	exportError,
	exportSuccess,
	useNativeExport,
	onExport,
}: ExportPanelProps) => (
	<div className="bg-mocha-surface0 rounded-xl p-5 border border-mocha-surface0 shadow-lg flex flex-col gap-3">
		<h2 className="text-sm font-bold uppercase tracking-wider text-mocha-subtext0 border-b border-mocha-surface1 pb-2">
			Export
		</h2>
		
		<p className="text-xs text-mocha-subtext1 select-none">
			Trim range: <span className="font-semibold text-mocha-text">{((start / 1000) * videoDuration).toFixed(2)}s</span> to <span className="font-semibold text-mocha-text">{((end / 1000) * videoDuration).toFixed(2)}s</span>
		</p>

		{/* Export error */}
		{exportError && (
			<div className="p-2.5 bg-mocha-red/10 border border-mocha-red/30 rounded-lg text-[11px] text-mocha-red break-words font-medium">
				⚠️ {exportError}
			</div>
		)}

		{/* Export success */}
		{exportSuccess && (
			<div className="p-2.5 bg-mocha-green/10 border border-mocha-green/30 rounded-lg text-[11px] text-mocha-green break-words font-medium">
				✅ {exportSuccess}
			</div>
		)}

		{/* Progress bar */}
		{exporting && (
			<div className="mt-1">
				<div className="w-full h-1.5 bg-mocha-surface2 rounded-full overflow-hidden">
					<div
						className="h-full bg-mocha-mauve rounded-full transition-all duration-300 ease-out"
						style={{ width: `${Math.round(exportProgress * 100)}%` }}
					/>
				</div>
				<p className="text-[10px] text-mocha-subtext0 mt-1 text-center font-bold">
					Exporting: {Math.round(exportProgress * 100)}%
				</p>
			</div>
		)}

		<button
			onClick={onExport}
			disabled={exporting}
			className="w-full bg-mocha-mauve text-mocha-crust py-2.5 rounded-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-50 font-bold transition-all text-xs shadow-md"
		>
			{exporting ? "Exporting..." : `Export as .${outputFormat}`}
		</button>

		{/* Footer: runtime info */}
		{useNativeExport && (
			<p className="text-[9px] text-mocha-overlay1 text-center italic mt-1 select-none">
				⚡ Running native hardware-accelerated FFmpeg
			</p>
		)}
	</div>
);
