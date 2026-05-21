import { useCallback, useEffect, useRef, useState } from "react";

export const Player = (ctx: {
  videoSrc: string,
  positionState: { position: number, setPosition: (time: number) => void },
  isPlayingState: { isPlaying: boolean, setIsPlaying: (playing: boolean) => void },
  startState: { start: number, setStart: (time: number) => void },
  endState: { end: number, setEnd: (time: number) => void }
}) => {

  const videoRef = useRef<HTMLVideoElement>(null);
  // const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      video.pause();
    } else {
      // Tolérance d'arrondi: si on est très proche de la fin
      if (Math.ceil(ctx.positionState.position) >= ctx.endState.end) {
        ctx.positionState.setPosition(ctx.startState.start);
        video.currentTime = (ctx.startState.start / 1000) * (video.duration || 0);
      }
      video.play().catch((err) => console.error("Erreur lecture: ", err));
    }
  }, [ctx.positionState.position, ctx.endState.end, ctx.startState.start]);

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

    if (ctx.isPlayingState.isPlaying && video.paused) {
      video.play();
    } else if (!ctx.isPlayingState.isPlaying && !video.paused) {
      video.pause();
    }
  }, [ctx.isPlayingState.isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isNaN(video.duration)) return;

    const newTime = (ctx.positionState.position / 1000) * video.duration;
    if (Math.abs(video.currentTime - newTime) > 0.1) {
      video.currentTime = newTime;
    }
  }, [ctx.positionState.position]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const progress = (video.currentTime / video.duration) * 1000;
    ctx.positionState.setPosition(progress);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = (parseInt(e.target.value) / 1000) * video.duration;
    video.currentTime = newTime;
    ctx.positionState.setPosition(parseInt(e.target.value));
  };

  return (
    <div>
      <video
        ref={videoRef}
        src={ctx.videoSrc}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => ctx.isPlayingState.setIsPlaying(true)}
        onPause={() => ctx.isPlayingState.setIsPlaying(false)}
      />
      <input
        type="range"
        min={0}
        max={1000}
        value={ctx.positionState.position}
        onChange={handleSliderChange}
        className="w-full"
      />
      {/* <p>Timeline: {timelineState.toFixed(2)}%</p> */}
    </div>
  );
}