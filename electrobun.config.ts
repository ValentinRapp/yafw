import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "yafw",
		identifier: "yafw.electrobun.dev",
		version: "0.7.1",
	},
	build: {
		// Vite builds to dist/, Electrobun copies from there into the bundle
		copy: {
			"dist/index.html": "views/mainview/index.html",
			"dist/assets": "views/mainview/assets",
		},
		// Ignore Vite output in watch mode — HMR handles view rebuilds separately
		watchIgnore: ["dist/**"],
		mac: {
			bundleCEF: false,
		},
		linux: {
			bundleCEF: false,
			icon: "src/mainview/assets/logo.png",
		},
		win: {
			bundleCEF: false,
			icon: "src/mainview/assets/logo.ico",
		},
	},
	release: {
		baseUrl: "https://github.com/ValentinRapp/yafw/releases/latest/download"
		// baseUrl: "http://localhost:8000"
	},
} satisfies ElectrobunConfig;
