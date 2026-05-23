import { useRef, useState, useEffect } from "react";

interface TimelineProps {
	startState: { start: number; setStart: (time: number) => void };
	endState: { end: number; setEnd: (time: number) => void };
	positionState: { position: number; setPosition: (time: number) => void };
	videoDuration: number;
}

export const Timeline = ({ startState, endState, positionState, videoDuration }: TimelineProps) => {
	const timelineRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState<"start" | "end" | "playhead" | null>(null);

	const getValFromEvent = (e: MouseEvent | React.MouseEvent) => {
		if (!timelineRef.current) return 0;
		const rect = timelineRef.current.getBoundingClientRect();
		const clientX = e.clientX;
		const relativeX = clientX - rect.left;
		const pct = Math.max(0, Math.min(1, relativeX / rect.width));
		return Math.round(pct * 1000);
	};

	const handleMouseDown = (e: React.MouseEvent, type: "start" | "end" | "playhead") => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(type);
		
		// Immediately jump to position if scrubbing playhead
		if (type === "playhead") {
			positionState.setPosition(getValFromEvent(e));
		}
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			const val = getValFromEvent(e);
			if (isDragging === "playhead") {
				positionState.setPosition(val);
			} else if (isDragging === "start") {
				if (val <= endState.end) {
					startState.setStart(val);
					// Keep playhead inside or at start when dragging start handle
					if (positionState.position < val) {
						positionState.setPosition(val);
					}
				}
			} else if (isDragging === "end") {
				if (val >= startState.start) {
					endState.setEnd(val);
					// Keep playhead inside or at end when dragging end handle
					if (positionState.position > val) {
						positionState.setPosition(val);
					}
				}
			}
		};

		const handleMouseUp = () => {
			setIsDragging(null);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, startState, endState, positionState]);

	// Format time helper (seconds to e.g. 02.45s)
	const formatTime = (val: number) => {
		const seconds = (val / 1000) * videoDuration;
		return `${seconds.toFixed(2)}s`;
	};

	const startPct = (startState.start / 1000) * 100;
	const endPct = (endState.end / 1000) * 100;
	const widthPct = ((endState.end - startState.start) / 1000) * 100;
	const posPct = (positionState.position / 1000) * 100;

	// Render ticks for the ruler (e.g. 10 ticks)
	const renderTicks = () => {
		const ticks = [];
		for (let i = 0; i <= 10; i++) {
			const pct = i * 10;
			const timeLabel = formatTime(i * 100);
			ticks.push(
				<div 
					key={i} 
					className="absolute top-0 bottom-0 flex flex-col justify-between items-center select-none pointer-events-none"
					style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
				>
					<div className="w-[1px] h-2 bg-mocha-surface2" />
					{i % 2 === 0 && (
						<span className="text-[9px] text-mocha-overlay1 font-mono">{timeLabel}</span>
					)}
				</div>
			);
		}
		return ticks;
	};

	return (
		<div className="relative w-full flex flex-col rounded-lg overflow-hidden border border-mocha-surface1 bg-mocha-crust/50">
			{/* Timeline Ruler */}
			<div 
				className="relative w-full h-7 bg-mocha-crust/80 border-b border-mocha-surface1 cursor-pointer"
				onMouseDown={(e) => handleMouseDown(e, "playhead")}
			>
				{renderTicks()}
				
				{/* Playhead Handle Pointer (Triangle) */}
				<div 
					className="absolute -bottom-1 -ml-1.5 pointer-events-none z-40 transition-all duration-75"
					style={{ left: `${posPct}%` }}
				>
					<svg className="w-3 h-3 text-mocha-red fill-current" viewBox="0 0 24 24">
						<path d="M12 21l-12-18h24z"/>
					</svg>
				</div>
			</div>

			{/* Timeline Tracks Lane */}
			<div 
				ref={timelineRef}
				className="relative w-full h-14 bg-mocha-mantle/40 cursor-pointer overflow-visible"
				onMouseDown={(e) => handleMouseDown(e, "playhead")}
			>
				{/* Visual Grid Lines */}
				<div className="absolute inset-0 flex flex-col justify-around pointer-events-none opacity-20">
					<div className="w-full h-[1px] bg-mocha-surface2" />
					<div className="w-full h-[1px] bg-mocha-surface2" />
				</div>

				{/* Selection Clip Track Block */}
				<div
					className="absolute top-1 bottom-1 bg-mocha-mauve/15 border-y-2 border-mocha-mauve/40 flex items-center justify-between shadow-inner"
					style={{ left: `${startPct}%`, width: `${widthPct}%` }}
					onMouseDown={(e) => e.stopPropagation()} // Prevent clicking the clip from scrubbing
				>
					{/* Left trim handle */}
					<div
						className="absolute left-0 top-0 bottom-0 w-3 bg-mocha-mauve cursor-col-resize flex items-center justify-center hover:bg-mocha-pink active:bg-mocha-pink transition-all shadow-md rounded-l"
						onMouseDown={(e) => handleMouseDown(e, "start")}
					>
						<div className="w-[1.5px] h-4 bg-mocha-crust opacity-70" />
					</div>

					{/* Label showing Clip Info */}
					<span className="w-full text-center text-[10px] text-mocha-mauve font-semibold select-none pointer-events-none px-4 truncate">
						✂️ ACTIVE CLIP ({formatTime(startState.start)} - {formatTime(endState.end)})
					</span>

					{/* Right trim handle */}
					<div
						className="absolute right-0 top-0 bottom-0 w-3 bg-mocha-mauve cursor-col-resize flex items-center justify-center hover:bg-mocha-pink active:bg-mocha-pink transition-all shadow-md rounded-r"
						onMouseDown={(e) => handleMouseDown(e, "end")}
					>
						<div className="w-[1.5px] h-4 bg-mocha-crust opacity-70" />
					</div>
				</div>

				{/* Playhead vertical line */}
				<div
					className="absolute top-0 bottom-0 w-[1.5px] bg-mocha-red pointer-events-none z-30 transition-all duration-75 shadow-lg"
					style={{ left: `${posPct}%` }}
				/>
			</div>
		</div>
	);
};