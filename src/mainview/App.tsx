import { useVideoEditor } from "./hooks/useVideoEditor";
import { Header } from "./components/Header";
import { DownloadPage } from "./components/DownloadPage";
import { LandingPage } from "./components/LandingPage";
import { EditorPage } from "./components/EditorPage";
import { OUTPUT_FORMATS } from "./constants";

const App = () => {
	const {
		videoSrc,
		position,
		setPosition,
		isPlaying,
		setIsPlaying,
		start,
		setStart,
		end,
		setEnd,
		videoDuration,
		reencode,
		setReencode,
		outputFormat,
		setOutputFormat,
		bitrate,
		setBitrate,
		clipDuration,
		outputWidth,
		setOutputWidth,
		outputHeight,
		setOutputHeight,
		originalWidth,
		originalHeight,
		lockAspectRatio,
		setLockAspectRatio,
		originalFps,
		outputFps,
		setOutputFps,
		useNativeExport,
		hasHwAccSupport,
		hwAcc,
		setHwAcc,
		exporting,
		exportProgress,
		exportError,
		exportSuccess,
		currentPage,
		setCurrentPage,
		handleFileSelect,
		handleNativeBrowse,
		handleChangeVideo,
		exportVideo,
		isConverting,
	} = useVideoEditor();

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
						className={`bg-mocha-surface0/60 backdrop-blur-md rounded-2xl border border-mocha-surface0 shadow-2xl w-full transition-all relative overflow-hidden ${
							currentPage === "download"
								? "max-w-3xl p-6 md:p-10"
								: "max-w-2xl p-8 md:p-12"
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
			) : (
				<EditorPage
					videoSrc={videoSrc}
					position={position}
					setPosition={setPosition}
					isPlaying={isPlaying}
					setIsPlaying={setIsPlaying}
					start={start}
					setStart={setStart}
					end={end}
					setEnd={setEnd}
					videoDuration={videoDuration}
					reencode={reencode}
					setReencode={setReencode}
					outputFormat={outputFormat}
					setOutputFormat={setOutputFormat}
					outputFormats={OUTPUT_FORMATS}
					isConverting={isConverting}
					bitrate={bitrate}
					setBitrate={setBitrate}
					clipDuration={clipDuration}
					outputWidth={outputWidth}
					setOutputWidth={setOutputWidth}
					outputHeight={outputHeight}
					setOutputHeight={setOutputHeight}
					originalWidth={originalWidth}
					originalHeight={originalHeight}
					lockAspectRatio={lockAspectRatio}
					setLockAspectRatio={setLockAspectRatio}
					originalFps={originalFps}
					outputFps={outputFps}
					setOutputFps={setOutputFps}
					useNativeExport={useNativeExport}
					hasHwAccSupport={hasHwAccSupport}
					hwAcc={hwAcc}
					setHwAcc={setHwAcc}
					exporting={exporting}
					exportProgress={exportProgress}
					exportError={exportError}
					exportSuccess={exportSuccess}
					onExport={exportVideo}
				/>
			)}
		</div>
	);
};

export default App;
