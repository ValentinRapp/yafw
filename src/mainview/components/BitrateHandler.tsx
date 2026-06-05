import { AUDIO_BITRATE_KBPS } from "../constants";

interface BitrateHandlerProps {
	bitrate: number;
	setBitrate: (value: number) => void;
	clipDuration: number;
	disabled: boolean;
}

export const BitrateHandler = ({
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
