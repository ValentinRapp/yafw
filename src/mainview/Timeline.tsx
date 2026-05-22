interface TimelineProps {
	startState: { start: number; setStart: (time: number) => void };
	endState: { end: number; setEnd: (time: number) => void };
	setPosition: (time: number) => void;
}

const SLIDER_THUMB_CLASSES =
	"absolute w-full appearance-none bg-transparent pointer-events-none " +
	"[&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto " +
	"[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-mocha-text " +
	"[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer " +
	"[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-mocha-text " +
	"[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:cursor-pointer";

export const Timeline = ({ startState, endState, setPosition }: TimelineProps) => {
	const leftPercent = (startState.start / 1000) * 100;
	const widthPercent = ((endState.end - startState.start) / 1000) * 100;

	return (
		<div className="relative w-full h-8 flex items-center mt-2">
			{/* Background track */}
			<div className="absolute w-full h-2 bg-mocha-surface2 rounded-full" />

			{/* Highlighted selected region */}
			<div
				className="absolute h-2 bg-mocha-mauve rounded-full pointer-events-none"
				style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
			/>

			{/* Start handle */}
			<input
				className={`${SLIDER_THUMB_CLASSES} z-10`}
				value={startState.start}
				type="range"
				min={0}
				max={1000}
				onChange={(e) => {
					if (e.target.valueAsNumber <= endState.end) {
						startState.setStart(parseInt(e.target.value));
						setPosition(parseInt(e.target.value));
					}
				}}
			/>

			{/* End handle */}
			<input
				className={`${SLIDER_THUMB_CLASSES} z-20`}
				value={endState.end}
				type="range"
				min={0}
				max={1000}
				onChange={(e) => {
					if (e.target.valueAsNumber >= startState.start) {
						endState.setEnd(parseInt(e.target.value));
						setPosition(parseInt(e.target.value));
					}
				}}
			/>
		</div>
	);
};