import * as Electrobun from "electrobun";

export const update = async () => {
    console.log("[YAFW Backend] Starting update download...");
    try {
        // await Bun.sleep(3000); // Simulate delay for testing
        await Electrobun.Updater.downloadUpdate();
        if (Electrobun.Updater.updateInfo()?.updateReady) {
            console.log("[YAFW Backend] Update ready. Applying update...");
            await Electrobun.Updater.applyUpdate();
        }
    } catch (err) {
        console.error("[YAFW Backend] Background update execution failed:", err);
    }
};