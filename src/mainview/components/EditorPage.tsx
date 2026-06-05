import { Player } from "./Player";
import { Timeline } from "./Timeline";
import { EncoderSettings } from "./EncoderSettings";
import { ExportPanel } from "./ExportPanel";

export const EditorPage = () => (
	<main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 max-w-7xl w-full mx-auto relative z-10">
		{/* Left column: Player + Timeline */}
		<div className="flex-1 flex flex-col gap-6">
			<Player />

			<div className="bg-mocha-surface0 rounded-xl p-5 border border-mocha-surface0 shadow-lg">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-mocha-subtext0 mb-4 select-none">
					Timeline & Trim Controls
				</h3>
				<Timeline />
			</div>
		</div>

		{/* Right column: Encoder & Export Settings Sidebar */}
		<div className="w-full lg:w-80 flex flex-col gap-6">
			<EncoderSettings />
			<ExportPanel />
		</div>
	</main>
);
