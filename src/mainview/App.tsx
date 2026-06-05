import { useLayoutEffect, useRef, useState } from "react";
import { useVideoEditor } from "./hooks/useVideoEditor";
import { Header } from "./components/Header";
import { DownloadPage } from "./components/DownloadPage";
import { LandingPage } from "./components/LandingPage";
import { EditorPage } from "./components/EditorPage";
import { VideoEditorProvider } from "./context/VideoEditorContext";

const App = () => {
	const editorState = useVideoEditor();
	const {
		videoSrc,
		currentPage,
		setCurrentPage,
		handleFileSelect,
		handleNativeBrowse,
		handleChangeVideo,
	} = editorState;

	const cardRef = useRef<HTMLDivElement>(null);
	const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);

	useLayoutEffect(() => {
		const element = cardRef.current;
		if (element) {
			const newHeight = element.offsetHeight;
			if (newHeight !== cardHeight) {
				setCardHeight(newHeight);
			}
		}
	});

	return (
		<div className="flex flex-col bg-mocha-base min-h-screen text-mocha-text relative overflow-hidden">
			{/* Background Glows (visible on all pages, adds premium feel) */}
			<div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-mocha-mauve/5 rounded-full blur-[120px] pointer-events-none" />
			<div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-mocha-blue/3 rounded-full blur-[100px] pointer-events-none" />

			{/* Navbar / Header */}
			<Header
				currentPage={currentPage}
				setCurrentPage={setCurrentPage}
				videoSrc={videoSrc}
				onChangeVideo={handleChangeVideo}
			/>

			{/* Main Content Area */}
			{currentPage === "download" || !videoSrc ? (
				<div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full">
					<div
						className={`bg-mocha-surface0/60 backdrop-blur-md rounded-2xl border border-mocha-surface0 shadow-2xl w-full transition-all ease-in-out relative overflow-hidden ${
							currentPage === "download" ? "max-w-3xl" : "max-w-2xl"
						}`}
						style={{ height: cardHeight ? `${cardHeight}px` : "auto" }}
					>
						<div
							ref={cardRef}
							className={`w-full transition-all duration-500 ease-in-out ${
								currentPage === "download" ? "p-6 md:p-10" : "p-8 md:p-12"
							}`}
						>
							{currentPage === "download" ? (
								<DownloadPage onNavigateEditor={() => setCurrentPage("editor")} />
							) : (
								<LandingPage
									onFileSelect={handleFileSelect}
									onNativeBrowse={handleNativeBrowse}
									onNavigateDownload={() => setCurrentPage("download")}
								/>
							)}
						</div>
					</div>
				</div>
			) : (
				<VideoEditorProvider value={editorState}>
					<EditorPage />
				</VideoEditorProvider>
			)}
		</div>
	);
};

export default App;
