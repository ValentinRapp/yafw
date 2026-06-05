// Detect if running inside Electrobun's native webview
export const isStandalone =
	typeof window !== "undefined" && "__electrobunSendToHost" in window;

// Detect if running on macOS (useful for platform-specific styling like traffic lights padding and titlebar drag)
export const isMac =
	typeof window !== "undefined" &&
	/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent || navigator.platform || "");
