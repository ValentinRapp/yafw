import { useCallback, useEffect, useRef } from "react";

interface PlayerProps {
	videoSrc: string;
	positionState: { position: number; setPosition: (time: number) => void };
	isPlayingState: { isPlaying: boolean; setIsPlaying: (playing: boolean) => void };
	startState: { start: number; setStart: (time: number) => void };
	endState: { end: number; setEnd: (time: number) => void };
}

export const Player = ({ videoSrc, positionState, isPlayingState, startState, endState }: PlayerProps) => {
	const videoRef = useRef<HTMLVideoElement>(null);

	const togglePlay = useCallback(() => {
		const video = videoRef.current;
		if (!video) return;

		if (!video.paused) {
			video.pause();
		} else {
			// If at or past the end, loop back to start
			if (Math.ceil(positionState.position) >= endState.end) {
				positionState.setPosition(startState.start);
				video.currentTime = (startState.start / 1000) * (video.duration || 0);
			}
			video.play().catch((err) => console.error("Playback error:", err));
		}
	}, [positionState.position, endState.end, startState.start]);

	// Space bar toggles play/pause
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

	// Sync video element play state with React state
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		if (isPlayingState.isPlaying && video.paused) {
			video.play();
		} else if (!isPlayingState.isPlaying && !video.paused) {
			video.pause();
		}
	}, [isPlayingState.isPlaying]);

	// Sync video currentTime with position state
	useEffect(() => {
		const video = videoRef.current;
		if (!video || isNaN(video.duration)) return;

		const newTime = (positionState.position / 1000) * video.duration;
		if (Math.abs(video.currentTime - newTime) > 0.1) {
			video.currentTime = newTime;
		}
	}, [positionState.position]);

	const handleTimeUpdate = () => {
		const video = videoRef.current;
		if (!video) return;
		const progress = (video.currentTime / video.duration) * 1000;
		positionState.setPosition(progress);
	};

	const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const video = videoRef.current;
		if (!video) return;
		const value = parseInt(e.target.value);
		const newTime = (value / 1000) * video.duration;
		video.currentTime = newTime;
		positionState.setPosition(value);
	};

	return (
		<div>
			<video
				ref={videoRef}
				src={videoSrc}
				onTimeUpdate={handleTimeUpdate}
				onPlay={() => isPlayingState.setIsPlaying(true)}
				onPause={() => isPlayingState.setIsPlaying(false)}
			/>
			<input
				type="range"
				min={0}
				max={1000}
				value={positionState.position}
				onChange={handleSliderChange}
				className="w-full"
			/>
		</div>
	);
};