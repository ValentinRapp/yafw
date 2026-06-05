import { useRef, useState } from "react";
import { isStandalone } from "../env";

interface FileDropZoneProps {
	onFileSelect: (file: File) => void;
	onNativeBrowse?: () => void;
}

export const FileDropZone = ({ onFileSelect, onNativeBrowse }: FileDropZoneProps) => {
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		// In standalone mode, always use native dialog (drop doesn't give us a file path)
		if (isStandalone && onNativeBrowse) {
			onNativeBrowse();
			return;
		}

		const file = e.dataTransfer.files[0];
		if (file && file.type.startsWith("video/")) {
			onFileSelect(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleClick = () => {
		// In standalone mode, always use native dialog
		if (isStandalone && onNativeBrowse) {
			onNativeBrowse();
			return;
		}
		fileInputRef.current?.click();
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) onFileSelect(file);
	};

	return (
		<div
			className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
				isDragging
					? "border-mocha-mauve bg-mocha-mauve/10 scale-[1.02]"
					: "border-mocha-surface2 hover:border-mocha-overlay0"
			}`}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragLeave={() => setIsDragging(false)}
			onClick={handleClick}
		>
			{/* Browser file input (only used in browser mode) */}
			{!isStandalone && (
				<input
					ref={fileInputRef}
					type="file"
					accept="video/*"
					className="hidden"
					onChange={handleInputChange}
				/>
			)}
			<div className="text-4xl mb-3 select-none">🎬</div>
			<p className="text-mocha-subtext1 font-medium">
				{isStandalone
					? "Click to select a video file"
					: "Drag & drop a video file here"}
			</p>
			<p className="text-mocha-overlay1 text-sm mt-1">
				{isStandalone
					? "opens system file explorer"
					: "or click to browse"}
			</p>
		</div>
	);
};
