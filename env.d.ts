/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

interface VPSEmitData {
	file: string;
	code: string;
}

declare module 'vite/types/customEvent' {
	interface CustomEventMap {
		'vps:hot-module-replace': string;
	}
}

declare interface Window {
	__VPS_HMR: {
		emit: (data: VPSEmitData) => void
	}
}
