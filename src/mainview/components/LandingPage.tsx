import { FileDropZone } from "./FileDropZone";
import { isStandalone } from "../env";
import logoUrl from "../assets/logo.png";

interface LandingPageProps {
	onFileSelect: (file: File) => void;
	onNativeBrowse: () => void;
	onNavigateDownload: () => void;
}

export const LandingPage = ({
	onFileSelect,
	onNativeBrowse,
	onNavigateDownload,
}: LandingPageProps) => (
	<>
		<div className="text-center mb-8">
			<img src={logoUrl} alt="YAFW Logo" className="w-16 h-16 mx-auto mb-4 object-contain animate-bounce select-none" />
			<h1 className="text-4xl md:text-5xl font-black tracking-wider bg-gradient-to-r from-mocha-mauve via-mocha-pink to-mocha-blue bg-clip-text text-transparent mb-2">
				YAFW
			</h1>
			<p className="text-xs uppercase tracking-widest text-mocha-subtext0 font-semibold mb-3">
				Yet Another FFmpeg Wrapper
			</p>
			<p className="text-sm text-mocha-subtext1 max-w-md mx-auto">
				A modern, lightweight video editor to trim, adjust, and re-encode videos in seconds. Completely private, fast, and gorgeous.
			</p>
		</div>

		{/* Small tip about Standalone version in browser view */}
		{!isStandalone && (
			<div className="mb-4 p-3 bg-mocha-mauve/10 border border-mocha-mauve/20 rounded-xl text-center text-xs text-mocha-subtext1 flex flex-col sm:flex-row items-center justify-between gap-3">
				<span className="text-left">
					💡 <strong className="text-mocha-mauve">Tip:</strong> Download the Desktop App for hardware-accelerated rendering and 50x faster export speeds.
				</span>
				<button
					onClick={onNavigateDownload}
					className="whitespace-nowrap px-2.5 py-1 bg-mocha-mauve text-mocha-crust font-bold rounded-lg text-[10px] hover:brightness-105 active:scale-95 transition-all shadow-sm"
				>
					📥 Get Desktop App
				</button>
			</div>
		)}

		<div className="bg-mocha-mantle/50 p-6 rounded-xl border border-mocha-surface1">
			<FileDropZone
				onFileSelect={onFileSelect}
				onNativeBrowse={
					isStandalone ? onNativeBrowse : undefined
				}
			/>
		</div>

		{/* Features list */}
		<div className="mt-8 grid grid-cols-3 gap-4 border-t border-mocha-surface1/60 pt-6 text-center text-xs text-mocha-subtext1">
			<div>
				<span className="text-lg block mb-1">⚡</span>
				<span className="font-bold text-mocha-text block">Instant Cuts</span>
				Stream copy mode without re-encoding.
			</div>
			<div>
				<span className="text-lg block mb-1">⚙️</span>
				<span className="font-bold text-mocha-text block">Pro Encoder</span>
				Adjust bitrate, custom resolution, and FPS.
			</div>
			<div>
				<span className="text-lg block mb-1">📦</span>
				<span className="font-bold text-mocha-text block">Dual Mode</span>
				Runs in browser (WASM) or native (standalone).
			</div>
		</div>
	</>
);
