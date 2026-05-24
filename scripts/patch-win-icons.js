import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const electrobunDir = path.resolve("node_modules/electrobun");
const distWinDir = path.resolve("node_modules/electrobun/dist-win-x64");
const rceditPath = path.resolve("node_modules/rcedit/bin/rcedit.exe");
const iconPath = path.resolve("src/mainview/assets/logo.ico");

async function run() {
	if (process.platform !== "win32") {
		console.log("Not on Windows, skipping Windows icon patch.");
		return;
	}

	if (!fs.existsSync(electrobunDir)) {
		console.error("electrobun module not found in node_modules.");
		return;
	}

	const pkg = JSON.parse(fs.readFileSync(path.join(electrobunDir, "package.json"), "utf8"));
	const version = pkg.version;

	if (!fs.existsSync(distWinDir)) {
		console.log(`Core win-x64 binaries not found. Downloading v${version}...`);
		fs.mkdirSync(distWinDir, { recursive: true });
		const url = `https://github.com/blackboardsh/electrobun/releases/download/v${version}/electrobun-core-win-x64.tar.gz`;
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to download core binaries: ${response.statusText}`);
		}
		const arrayBuffer = await response.arrayBuffer();
		const tarPath = path.resolve("node_modules/electrobun/core-win-x64.tar.gz");
		await Bun.write(tarPath, arrayBuffer);
		
		console.log("Extracting core binaries...");
		const tarCmd = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe");
		// Extract into dist-win-x64. The tarball has the files at its root level.
		const result = spawnSync(tarCmd, ["-xzf", tarPath], { cwd: distWinDir, stdio: "inherit" });
		if (result.status !== 0) {
			throw new Error("Tar extraction failed.");
		}
		fs.unlinkSync(tarPath);
	}

	console.log("Patching Windows template binaries with custom icon...");
	const targets = [
		path.join(distWinDir, "launcher.exe"),
		path.join(distWinDir, "bun.exe"),
		path.join(distWinDir, "extractor.exe")
	];

	for (const target of targets) {
		if (fs.existsSync(target)) {
			console.log(`Patching ${target}...`);
			const result = spawnSync(rceditPath, [target, "--set-icon", iconPath]);
			if (result.status !== 0) {
				console.error(`Failed to patch ${target}:`, result.stderr ? result.stderr.toString() : "unknown error");
			}
		} else {
			console.warn(`Target not found: ${target}`);
		}
	}
	console.log("Icon patching complete!");
}

run().catch(console.error);
