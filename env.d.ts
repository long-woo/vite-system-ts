/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

declare module 'vite/types/customEvent' {
	interface CustomEventMap {
		'vps:hot-module-replace': string;
	}
}

declare interface Window {
	__VPS_HMR: {
		emit: (file: string) => void
	}
}
