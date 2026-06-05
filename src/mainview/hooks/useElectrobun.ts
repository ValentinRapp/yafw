import { useEffect, useRef, useState } from "react";
import { isStandalone } from "../env";
import { type AppRPCType } from "../../shared/types";

export const useElectrobun = () => {
	const [supportedEncoders, setSupportedEncoders] = useState<string[]>([]);
	const [electroview, setElectroview] = useState<any>(null);
	const electroviewRef = useRef<any>(null);

	useEffect(() => {
		if (!isStandalone) return;
		import("electrobun/view")
			.then(({ Electroview }: any) => {
				const rpc = Electroview.defineRPC<AppRPCType>({
					maxRequestTime: 600_000, // 10 min — native dialogs block
					handlers: { requests: {}, messages: {} },
				});
				const ev = new Electroview({ rpc });
				electroviewRef.current = ev;
				setElectroview(ev);
				console.log("[YAFW] Electrobun RPC initialized");

				// Detect hardware accelerators
				ev.rpc.request.detectHardwareAccelerators({})
					.then((res: any) => {
						setSupportedEncoders(res.supportedEncoders || []);
					})
					.catch((err: any) => {
						console.error("[YAFW] Failed to detect hardware accelerators:", err);
					});
			})
			.catch((err: unknown) => {
				console.warn("[YAFW] Electrobun unavailable:", err);
			});
	}, []);

	return {
		electroview,
		supportedEncoders,
		isStandalone,
	};
};
