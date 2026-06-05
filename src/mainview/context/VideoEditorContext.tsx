import { createContext, useContext, ReactNode } from "react";
import { useVideoEditor } from "../hooks/useVideoEditor";

type VideoEditorContextType = ReturnType<typeof useVideoEditor>;

const VideoEditorContext = createContext<VideoEditorContextType | null>(null);

interface VideoEditorProviderProps {
	value: VideoEditorContextType;
	children: ReactNode;
}

export const VideoEditorProvider = ({ value, children }: VideoEditorProviderProps) => (
	<VideoEditorContext.Provider value={value}>
		{children}
	</VideoEditorContext.Provider>
);

export const useVideoEditorContext = () => {
	const context = useContext(VideoEditorContext);
	if (!context) {
		throw new Error("useVideoEditorContext must be used within a VideoEditorProvider");
	}
	return context;
};
