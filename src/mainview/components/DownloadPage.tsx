import { useState } from "react";
import { getDetectedOS } from "../helpers";

interface DownloadPageProps {
	onNavigateEditor: () => void;
}

export const DownloadPage = ({ onNavigateEditor }: DownloadPageProps) => {
	const [activeDownloadTab, setActiveDownloadTab] = useState<"mac" | "windows" | "linux">(getDetectedOS());
	const [copiedCommand, setCopiedCommand] = useState(false);

	return (
		<>
			<h2 className="text-2xl md:text-3xl font-black text-center mb-6 tracking-wide bg-gradient-to-r from-mocha-mauve via-mocha-pink to-mocha-blue bg-clip-text text-transparent">
				Download & Install YAFW Desktop
			</h2>

			{/* Platform tabs */}
			<div className="flex justify-center border-b border-mocha-surface1 mb-6">
				{(["mac", "windows", "linux"] as const).map((tab) => (
					<button
						key={tab}
						onClick={() => {
							setActiveDownloadTab(tab);
							setCopiedCommand(false);
						}}
						className={`px-6 py-2.5 font-bold text-sm tracking-wider uppercase border-b-2 transition-all ${
							activeDownloadTab === tab
								? "border-mocha-mauve text-mocha-mauve"
								: "border-transparent text-mocha-subtext0 hover:text-mocha-text"
						}`}
					>
						{tab === "mac" ? "🍏 macOS" : tab === "windows" ? "🏁 Windows" : "🐧 Linux"}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className="min-h-[220px]">
				{activeDownloadTab === "mac" && (
					<div className="flex flex-col gap-4">
						<p className="text-sm text-mocha-subtext1">
							The macOS version is packaged specifically for Apple Silicon and is installed via <strong>Homebrew Cask</strong>.
						</p>
						<div className="bg-mocha-mantle/70 border border-mocha-surface1 rounded-xl p-4 flex flex-col gap-3">
							<span className="text-[10px] text-mocha-overlay1 uppercase font-bold tracking-wider select-none">
								Run this command in your Terminal:
							</span>
							<div className="flex items-center justify-between bg-mocha-crust/50 px-4 py-3 rounded-lg font-mono text-xs text-mocha-mauve overflow-x-auto select-all">
								<span>
									brew tap valentinrapp/yafw && brew install --cask valentinrapp/yafw/yafw
								</span>
								<button
									onClick={() => {
										navigator.clipboard.writeText("brew tap valentinrapp/yafw && brew install --cask valentinrapp/yafw/yafw");
										setCopiedCommand(true);
										setTimeout(() => setCopiedCommand(false), 2000);
									}}
									className="ml-3 px-3 py-1 bg-mocha-surface1 hover:bg-mocha-surface2 active:scale-95 text-[10px] font-bold text-mocha-text rounded-md transition-all whitespace-nowrap select-none"
								>
									{copiedCommand ? "✅ Copied!" : "📋 Copy"}
								</button>
							</div>
						</div>
						<div className="text-xs text-mocha-subtext0 space-y-1">
							<p>Requires <strong>Homebrew</strong> installed. If you don't have it, install it first from <a href="https://brew.sh" target="_blank" rel="noopener noreferrer" className="text-mocha-blue hover:underline">brew.sh</a>.</p>
						</div>
					</div>
				)}

				{activeDownloadTab === "windows" && (
					<div className="flex flex-col gap-5">
						<div className="flex flex-col sm:flex-row items-center gap-4 bg-mocha-mantle/30 p-4 rounded-xl border border-mocha-surface1">
							<div className="flex-1 text-center sm:text-left">
								<h3 className="text-sm font-bold text-mocha-text mb-1">YAFW for Windows (x64)</h3>
								<p className="text-xs text-mocha-subtext0">Portable zip bundle containing the native executable installer.</p>
							</div>
							<a
								href="https://github.com/ValentinRapp/yafw/releases/latest/download/stable-win-x64-yafw-Setup.zip"
								className="px-5 py-2.5 bg-mocha-mauve hover:brightness-110 active:scale-95 text-mocha-crust font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
							>
								📥 Download for Windows
							</a>
						</div>
						<div className="text-xs text-mocha-subtext1 space-y-2">
							<h4 className="font-bold text-mocha-text uppercase tracking-wider text-[10px] select-none">Installation Steps:</h4>
							<ol className="list-decimal list-inside space-y-1.5 pl-1">
								<li>Download the <code className="text-mocha-pink font-mono">stable-win-x64-yafw-Setup.zip</code> archive.</li>
								<li>Right-click the zip file and select <strong>Extract All</strong>.</li>
								<li>Open the extracted folder and run <code className="text-mocha-pink font-mono">yafw-Setup.exe</code> to launch the app.</li>
							</ol>
						</div>
					</div>
				)}

				{activeDownloadTab === "linux" && (
					<div className="flex flex-col gap-5">
						<div className="flex flex-col sm:flex-row items-center gap-4 bg-mocha-mantle/30 p-4 rounded-xl border border-mocha-surface1">
							<div className="flex-1 text-center sm:text-left">
								<h3 className="text-sm font-bold text-mocha-text mb-1">YAFW for Linux (x64)</h3>
								<p className="text-xs text-mocha-subtext0">Gzipped tarball directory containing the standalone application binary.</p>
							</div>
							<a
								href="https://github.com/ValentinRapp/yafw/releases/latest/download/stable-linux-x64-yafw-Setup.tar.gz"
								className="px-5 py-2.5 bg-mocha-mauve hover:brightness-110 active:scale-95 text-mocha-crust font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
							>
								📥 Download for Linux
							</a>
						</div>
						<div className="text-xs text-mocha-subtext1 space-y-2">
							<h4 className="font-bold text-mocha-text uppercase tracking-wider text-[10px] select-none">Installation Steps:</h4>
							<ol className="list-decimal list-inside space-y-1.5 pl-1">
								<li>Download the <code className="text-mocha-pink font-mono">stable-linux-x64-yafw-Setup.tar.gz</code> archive.</li>
								<li>Extract the tarball using your archive manager or terminal:
									<pre className="mt-1 bg-mocha-crust/50 p-2 rounded-lg font-mono text-[10px] text-mocha-mauve overflow-x-auto select-all">
										tar -xzf stable-linux-x64-yafw-Setup.tar.gz
									</pre>
								</li>
								<li>Enter the extracted directory and run the <code className="text-mocha-pink font-mono">installer</code> binary to install the application.</li>
							</ol>
						</div>
					</div>
				)}
			</div>

			{/* Footer & Star reminder */}
			<div className="mt-8 pt-6 border-t border-mocha-surface1 text-center flex flex-col items-center gap-4">
				<p className="text-xs text-mocha-subtext0">
					and don't forget to <a href="https://github.com/ValentinRapp/yafw" target="_blank" rel="noopener noreferrer" className="text-mocha-mauve hover:underline font-bold">star the project on github</a> 😉
				</p>
				<button
					onClick={onNavigateEditor}
					className="text-xs font-semibold text-mocha-overlay1 hover:text-mocha-text transition-colors select-none"
				>
					← Return to Editor
				</button>
			</div>
		</>
	);
};
