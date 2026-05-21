// import { useState } from "react";
// import { Electroview } from "electrobun/view";
// import { type AppRPCType } from "../shared/types";

import { useCallback, useEffect, useRef, useState } from "react";
import { Player } from "./Player";
import { Timeline } from "./Timeline";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Electrobun exige l'objet handlers, même s'il est vide côté frontend
// const viewRpc = Electroview.defineRPC<AppRPCType>({
// 	handlers: {
// 		requests: {},
// 		messages: {}
// 	}
// });
// const electroview = new Electroview({ rpc: viewRpc });

// function App() {
// 	// Correction : on déclare la variable "number" au lieu de "count"
// 	const [number, setNumber] = useState(10);
// 	const [result, setResult] = useState<number | null>(null);
// 	const [loading, setLoading] = useState(false);

// 	const executerCalcul = async () => {
// 		setLoading(true);
// 		try {
// 			// electroview.rpc.request est maintenant safe et typé
// 			const response = await electroview.rpc?.request.calculateFibonacci({ n: number });
// 			setResult(response?.result || null);
// 		} catch (err) {
// 			console.error("Erreur RPC :", err);
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	return (
// 		<div className="p-8 text-white bg-gray-900 min-h-screen flex flex-col items-center justify-center">
// 			<div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full">
// 				<h1 className="text-xl font-bold mb-4 text-indigo-400">Fibonacci via Electrobun RPC</h1>
				
// 				<div className="flex gap-2 mb-4">
// 					<input
// 						type="number"
// 						value={number}
// 						onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
// 						className="border p-2 rounded text-black w-full font-mono"
// 					/>
// 					<button
// 						onClick={executerCalcul}
// 						disabled={loading}
// 						className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors whitespace-nowrap"
// 					>
// 						{loading ? "Calcul..." : "Calculer"}
// 					</button>
// 				</div>

// 				{result !== null && (
// 					<div className="bg-gray-900 p-4 rounded border border-gray-700">
// 						<p className="text-sm text-gray-400">Résultat pour n = {number} :</p>
// 						<p className="font-mono font-bold text-xl text-green-400 break-all">{result}</p>
// 					</div>
// 				)}
// 			</div>
// 		</div>
// 	);
// }

const App = () => {

  const [position, setPosition] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(1000);
  const [loaded, setLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());

  useEffect(() => {
    const video = document.createElement("video");
    video.src = "./video.mp4";
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
    };
  }, []);

  useEffect(() => {
    // Ajout d'une petite tolérance (- 0.1) pour les calculs de flottants de `currentTime`
    if (position < start - 0.1) {
      if (position !== start) setPosition(start);
      setIsPlaying(false);
    } else if (position >= end) {
      if (position !== end) setPosition(end);
      setIsPlaying(false);
    }
  }, [position, start, end]);

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on("log", ({ message }) => {
      console.log(message);
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    setLoaded(true);
  };

  const exportVideo = async () => {
    setExporting(true);
    try {
      if (!loaded) {
        await load();
      }
      
      const ffmpeg = ffmpegRef.current;
      
      // Load the video file into ffmpeg virtual file system
      await ffmpeg.writeFile("input.mp4", await fetchFile("./video.mp4"));
      
      const startTime = (start / 1000) * videoDuration;
      const endTime = (end / 1000) * videoDuration;
      
      console.log(`Exporting from ${startTime}s to ${endTime}s`);
      
      // Execute ffmpeg command to cut video
      // -ss seeks to the start time
      // -to stops at the end time
      // -c copy copies the streams without re-encoding (faster, but cuts only on keyframes)
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-ss", startTime.toString(),
        "-to", endTime.toString(),
        "-c", "copy",
        "output.mp4"
      ]);
      
      // Read the result
      const data = await ffmpeg.readFile("output.mp4");
      
      // Convert to blob and download
      const blob = new Blob([(data as Uint8Array).buffer as ArrayBuffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "exported-video.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-mocha-base min-h-screen text-mocha-text">
      <div className="bg-mocha-surface0 p-6 rounded-xl shadow-lg w-full max-w-xl">
        <Player 
          videoSrc="./video.mp4" 
          positionState={{position, setPosition}} 
          isPlayingState={{isPlaying, setIsPlaying}}
          startState={{start, setStart}}
          endState={{end, setEnd}}
        />
        <Timeline startState={{start, setStart}} endState={{end, setEnd}} setPosition={setPosition} />
        
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-mocha-subtext0">
            Export de {((start / 1000) * videoDuration).toFixed(2)}s à {((end / 1000) * videoDuration).toFixed(2)}s
          </p>
          <button 
            onClick={exportVideo} 
            disabled={exporting}
            className="bg-mocha-mauve text-mocha-crust px-4 py-2 rounded hover:brightness-110 disabled:opacity-50 font-bold transition-all"
          >
            {exporting ? "Export en cours..." : "Exporter la vidéo"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App;
