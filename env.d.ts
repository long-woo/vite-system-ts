/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference types="vite/client" />

interface ImportMeta {
	readonly hot: any;
}

declare module 'vite/types/customEvent' {
	interface CustomEventMap {
		'vps:hot-module-replace': string;
	}
  }
