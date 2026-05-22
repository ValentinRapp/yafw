import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "yafw",
		identifier: "yafw.electrobun.dev",
		version: "0.0.1",
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
		},
		win: {
			bundleCEF: false,
		},
	},
} satisfies ElectrobunConfig;
