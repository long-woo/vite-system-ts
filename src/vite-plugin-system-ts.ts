import type { Plugin } from "vite";

export interface ViteSystemTSOption {
	/**
	 * 
	 * 适用于微前端（Single-SPA），基座应用的入口文件路径。
	 * 
	 * @default main/src/main.js
	 */
	hotEnter?: string;
}

export const ViteSystemTS = (option: ViteSystemTSOption): Plugin => {
	const _hotEnter = option.hotEnter ?? "main/src/main.js";

	return {
		name: "vite-system-ts",
		apply: "serve",
		async handleHotUpdate({ server, file }) {
			// const _files = modules.map(_module => {
			// 	const _url = _module.url.slice(1);

			// 	return `${server.resolvedUrls?.local}${_url}`;
			// });
			// console.log(_files);
			const _file = file.replace(/.*\/(apps|packages)/, "");

			server.ws.send({
				type: "custom",
				event: "vps:hot-file-update",
				data: {
					file: _file,
				},
			});
			return [];
		},
		transform(code, id) {
			if (id.includes(_hotEnter)) {
				return `${code}

if (import.meta.hot) {
	import.meta.hot.on('vps:hot-file-update', (data) => {
		window.__VPS_HMR.emit(data);
	});
}`;
			}
		},
	};
};
