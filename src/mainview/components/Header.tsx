import { isStandalone, isMac } from "../env";
import logoUrl from "../assets/logo.png";

interface HeaderProps {
	currentPage: "editor" | "download";
	setCurrentPage: (page: "editor" | "download") => void;
	videoSrc: string | null;
	onChangeVideo: () => void;
}

export const Header = ({
	currentPage,
	setCurrentPage,
	videoSrc,
	onChangeVideo,
}: HeaderProps) => (
	<header className={`${isStandalone && isMac ? "electrobun-webkit-app-region-drag pl-24" : ""} bg-mocha-crust/80 backdrop-blur border-b border-mocha-surface0 px-6 py-4 flex items-center justify-between z-20`}>
		<div className="flex items-center gap-3 select-none">
			<img src={logoUrl} alt="YAFW Logo" className="w-8 h-8 object-contain rounded-md" />
			<div>
				<h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-mocha-mauve via-mocha-pink to-mocha-blue bg-clip-text text-transparent">
					YAFW
				</h1>
				<p className="text-[10px] text-mocha-subtext0 font-medium uppercase tracking-widest">
					Yet Another FFmpeg Wrapper
				</p>
			</div>
		</div>
		<div className="flex items-center gap-4">
			{currentPage === "download" ? (
				<button
					onClick={() => setCurrentPage("editor")}
					className="electrobun-webkit-app-region-no-drag px-3.5 py-2 text-xs font-bold bg-mocha-mauve text-mocha-crust hover:brightness-110 active:scale-95 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
				>
					← Back to Editor
				</button>
			) : (
				<>
					{/* Download Standalone Version (Browser mode only) */}
					{!isStandalone && (
						<div className="hidden sm:flex flex-col items-end gap-0.5">
							<button
								onClick={() => setCurrentPage("download")}
								className="electrobun-webkit-app-region-no-drag px-3 py-1.5 text-xs font-bold bg-mocha-mauve text-mocha-crust hover:brightness-110 active:scale-95 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
							>
								📥 Download Desktop App
							</button>
							<span className="text-[8px] text-mocha-overlay1 text-right font-medium leading-none">
								Runs locally with native FFmpeg for 50x faster export
							</span>
						</div>
					)}

					{/* Change Video Button (Only if video is loaded) */}
					{videoSrc && (
						<button
							onClick={onChangeVideo}
							className="electrobun-webkit-app-region-no-drag px-3.5 py-2 text-xs font-bold bg-mocha-surface1 text-mocha-text hover:bg-mocha-surface2 active:scale-95 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
						>
							📁 Change Video
						</button>
					)}
				</>
			)}
		</div>
	</header>
);
