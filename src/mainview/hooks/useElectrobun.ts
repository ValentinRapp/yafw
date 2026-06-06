import { useEffect, useRef, useState } from "react";
import { isStandalone } from "../env";
import { type AppRPCType } from "../../shared/types";

let sharedElectroview: any = null;
let sharedSupportedEncoders: string[] = [];
let isInitStarted = false;
const listeners = new Set<(ev: any, encoders: string[]) => void>();

export const useElectrobun = () => {
	const [supportedEncoders, setSupportedEncoders] = useState<string[]>(sharedSupportedEncoders);
	const [electroview, setElectroview] = useState<any>(sharedElectroview);

	useEffect(() => {
		if (!isStandalone) return;

		if (sharedElectroview) {
			setElectroview(sharedElectroview);
			setSupportedEncoders(sharedSupportedEncoders);
			return;
		}

		const handleInit = (ev: any, encoders: string[]) => {
			setElectroview(ev);
			setSupportedEncoders(encoders);
		};
		listeners.add(handleInit);

		if (!isInitStarted) {
			isInitStarted = true;
			import("electrobun/view")
				.then(({ Electroview }: any) => {
					const rpc = Electroview.defineRPC<AppRPCType>({
						maxRequestTime: 600_000, // 10 min — native dialogs block
						handlers: { requests: {}, messages: {} },
					});
					const ev = new Electroview({ rpc });
					sharedElectroview = ev;
					console.log("[YAFW] Electrobun RPC initialized");

					// Detect hardware accelerators
					ev.rpc.request.detectHardwareAccelerators({})
						.then((res: any) => {
							sharedSupportedEncoders = res.supportedEncoders || [];
							listeners.forEach((l) => l(sharedElectroview, sharedSupportedEncoders));
							listeners.clear();
						})
						.catch((err: any) => {
							console.error("[YAFW] Failed to detect hardware accelerators:", err);
							listeners.forEach((l) => l(sharedElectroview, []));
							listeners.clear();
						});
				})
				.catch((err: unknown) => {
					console.warn("[YAFW] Electrobun unavailable:", err);
					listeners.clear();
				});
		}

		return () => {
			listeners.delete(handleInit);
		};
	}, []);

	return {
		electroview,
		supportedEncoders,
		isStandalone,
	};
};
