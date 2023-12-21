import type { Plugin } from "vite";

export interface ViteSystemTSOption {
	/**
	 * 客户端处理热更新的入口文件，默认是 main.ts/main.js。
	 * 如果是微前端（Single-SPA），请使用主应用的入口文件。
	 */
	hotEnter?: string;
}

export const ViteSystemTS = (option: ViteSystemTSOption): Plugin => {
	const _hotEnter = option.hotEnter ?? "main";

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
					file: _file
				},
			});
			return [];
		},
		transform(code, id) {
			if (
				(_hotEnter === "main" && !/main.(j|t)s$/.test(_hotEnter)) ||
				!id.includes(_hotEnter)
			)
				return code;

			return {
				code: `${code}
				
				if (import.meta.hot) {
					import.meta.hot.on('vps:hot-file-update', (data) => {
						window.__VPS_HMR.emit(data)
					})
				}`,
			};
		},
	};
};
