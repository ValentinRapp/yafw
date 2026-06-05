import { useCallback, useEffect, useRef, useState } from "react";

interface PlayerProps {
	videoSrc: string;
	positionState: { position: number; setPosition: (time: number) => void };
	isPlayingState: { isPlaying: boolean; setIsPlaying: (playing: boolean) => void };
	startState: { start: number; setStart: (time: number) => void };
	endState: { end: number; setEnd: (time: number) => void };
	videoDuration: number;
}

export const Player = ({ videoSrc, positionState, isPlayingState, startState, endState, videoDuration }: PlayerProps) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);

	const togglePlay = useCallback(() => {
		const video = videoRef.current;
		if (!video) return;

		if (!video.paused) {
			video.pause();
		} else {
			if (Math.ceil(positionState.position) >= endState.end) {
				positionState.setPosition(startState.start);
				video.currentTime = (startState.start / 1000) * (video.duration || 0);
			}
			video.play().catch((err) => console.error("Playback error:", err));
		}
	}, [positionState.position, endState.end, startState.start]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === "Space") {
				e.preventDefault();
				togglePlay();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [togglePlay]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		if (isPlayingState.isPlaying && video.paused) {
			video.play().catch(() => {});
		} else if (!isPlayingState.isPlaying && !video.paused) {
			video.pause();
		}
	}, [isPlayingState.isPlaying]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video || isNaN(video.duration)) return;

		const newTime = (positionState.position / 1000) * video.duration;
		if (Math.abs(video.currentTime - newTime) > 0.1) {
			video.currentTime = newTime;
		}
	}, [positionState.position]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;
		video.volume = volume;
		video.muted = isMuted;
	}, [volume, isMuted]);

	const handleTimeUpdate = () => {
		const video = videoRef.current;
		if (!video) return;
		const progress = (video.currentTime / video.duration) * 1000;
		positionState.setPosition(progress);
	};

	const formatTimecode = (seconds: number) => {
		if (isNaN(seconds) || seconds < 0) return "00:00.00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		const ms = Math.floor((seconds % 1) * 100);
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
	};

	const currentSeconds = (positionState.position / 1000) * (videoRef.current?.duration || videoDuration);
	const durationSeconds = videoRef.current?.duration || videoDuration;

	return (
		<div className="bg-mocha-crust rounded-xl overflow-hidden border border-mocha-surface0 shadow-lg">
			{/* Screen aspect-video */}
			<div className="relative aspect-video bg-black flex items-center justify-center group select-none">
				<video
					ref={videoRef}
					src={videoSrc}
					onTimeUpdate={handleTimeUpdate}
					onPlay={() => isPlayingState.setIsPlaying(true)}
					onPause={() => isPlayingState.setIsPlaying(false)}
					onClick={togglePlay}
					className="w-full h-full object-contain cursor-pointer"
				/>
				
				{!isPlayingState.isPlaying && (
					<div 
						onClick={togglePlay}
						className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity group-hover:opacity-100"
					>
						<div className="w-14 h-14 flex items-center justify-center rounded-full bg-mocha-mauve/80 text-mocha-crust text-2xl font-bold shadow-lg hover:scale-110 transition-transform">
							▶
						</div>
					</div>
				)}
			</div>

			{/* Playback Controls Toolbar */}
			<div className="bg-mocha-mantle px-4 py-3 flex flex-wrap items-center justify-between border-t border-mocha-surface0 gap-3">
				{/* Left: Playback buttons */}
				<div className="flex items-center gap-1.5">
					<button
						onClick={() => {
							const video = videoRef.current;
							if (video) {
								video.currentTime = (startState.start / 1000) * video.duration;
								positionState.setPosition(startState.start);
							}
						}}
						className="p-2 rounded-lg hover:bg-mocha-surface0 text-mocha-text active:scale-95 transition-all text-sm"
						title="Jump to Trim Start"
					>
						⏮
					</button>
					<button
						onClick={() => {
							const video = videoRef.current;
							if (video) {
								video.currentTime = Math.max(0, video.currentTime - 0.1);
								positionState.setPosition((video.currentTime / video.duration) * 1000);
							}
						}}
						className="p-2 rounded-lg hover:bg-mocha-surface0 text-mocha-text active:scale-95 transition-all text-sm"
						title="Step Back 100ms"
					>
						◀
					</button>
					<button
						onClick={togglePlay}
						className="px-4 py-2 rounded-lg bg-mocha-mauve text-mocha-crust font-bold hover:brightness-110 active:scale-95 transition-all text-xs flex items-center gap-1.5 shadow-md"
						title="Play / Pause (Space)"
					>
						{isPlayingState.isPlaying ? (
							<>
								<span>❚❚</span>
								<span>Pause</span>
							</>
						) : (
							<>
								<span>▶</span>
								<span>Play</span>
							</>
						)}
					</button>
					<button
						onClick={() => {
							const video = videoRef.current;
							if (video) {
								video.currentTime = Math.min(video.duration, video.currentTime + 0.1);
								positionState.setPosition((video.currentTime / video.duration) * 1000);
							}
						}}
						className="p-2 rounded-lg hover:bg-mocha-surface0 text-mocha-text active:scale-95 transition-all text-sm"
						title="Step Forward 100ms"
					>
						▶
					</button>
					<button
						onClick={() => {
							const video = videoRef.current;
							if (video) {
								video.currentTime = (endState.end / 1000) * video.duration;
								positionState.setPosition(endState.end);
							}
						}}
						className="p-2 rounded-lg hover:bg-mocha-surface0 text-mocha-text active:scale-95 transition-all text-sm"
						title="Jump to Trim End"
					>
						⏭
					</button>
				</div>

				{/* Center: Timecode Display */}
				<div className="font-mono text-xs text-mocha-subtext0 bg-mocha-crust px-3 py-1.5 rounded-lg border border-mocha-surface0 select-none">
					{formatTimecode(currentSeconds)} / {formatTimecode(durationSeconds)}
				</div>

				{/* Right: Audio Volume Control */}
				<div className="flex items-center gap-2">
					<button
						onClick={() => setIsMuted(!isMuted)}
						className="p-2 rounded-lg hover:bg-mocha-surface0 text-mocha-text transition-all text-sm"
						title={isMuted ? "Unmute" : "Mute"}
					>
						{isMuted || volume === 0 ? "🔇" : "🔊"}
					</button>
					<input
						type="range"
						min={0}
						max={1}
						step={0.05}
						value={isMuted ? 0 : volume}
						onChange={(e) => {
							setVolume(parseFloat(e.target.value));
							setIsMuted(false);
						}}
						className="w-16 accent-mocha-mauve cursor-pointer h-1 rounded-lg bg-mocha-surface1"
						title="Volume"
					/>
				</div>
			</div>
		</div>
	);
};
