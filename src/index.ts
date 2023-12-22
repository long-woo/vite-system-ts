import { type RollupCache, rollup } from "@rollup/browser";

const System = require("systemjs");
// let buildCache: RollupCache | undefined = undefined;

const systemJSPrototype = System.constructor.prototype;
const jsonCssWasmContentType =
	/^(application\/json|application\/wasm|text\/css)(;|$)/;
const registerRegEx =
	/System\s*\.\s*register\s*\(\s*(\[[^\]]*\])\s*,\s*\(?function\s*\(\s*([^\\),\s]+\s*(,\s*([^\\),\s]+)\s*)?\s*)?\)/;

let _VPS_CACHE: Cache | null = null;

/**
 * Load the Rollup library from the specified URL.
 *
 * @param {string} url - The URL from which to load the Rollup library. Default is 'https://unpkg.com/@rollup/browser/dist'.
 * @return {Promise} A promise that resolves with the loaded Rollup library.
 */
const loadRollup = (url = "https://unpkg.com/@rollup/browser/dist") => {
	const _rollupUrl = "/rollup.browser.js";
	// 预加载 rollup wasm 文件
	const _preloadRollupWasmFile = fetch("/bindings_wasm_bg.wasm").catch(
		() => {},
	);

	return new Promise((resolve, reject) => {
		const _script = document.createElement("script");

		_script.src = _rollupUrl;
		_script.addEventListener("load", async () => {
			_preloadRollupWasmFile && (await _preloadRollupWasmFile);
			resolve(rollup);
		});
		_script.addEventListener("error", () => {
			reject(new Error(`Failed to load ${_rollupUrl}`));
		});
		document.querySelector("head")?.append(_script);
	});
};

const openCache = async () => {
	if (!_VPS_CACHE) {
		_VPS_CACHE = await caches.open("VITE_SYSTEM_TS_CACHE");
	}
};

/**
 * Builds the code using Rollup.
 *
 * @param {string} url - The URL of the input file.
 * @param {string} code - The code to be bundled.
 * @return {Promise<OutputChunk>} The bundled code.
 */
const buildWithRollup = async (url: string, code: string) => {
	const _bundle = await rollup({
		input: url,
		// cache: buildCache,
		plugins: [
			{
				name: "url-resolver",
				resolveId(source, importer) {
					if (source[0] !== ".") {
						try {
							new URL(source);
							// If it is a valid URL, return it
							return source;
						} catch {
							// Otherwise make it external
							return { id: source, external: true };
						}
					}
					return new URL(source, importer).href;
				},
				load(id) {
					return code;
				},
			},
		],
	});

	// buildCache = _bundle.cache;
	const { output } = await _bundle.generate({
		format: "systemjs",
		sourcemap: "inline",
	});
	return output[0];
};

/**
 * Retrieves the transformed code by building with Rollup.
 *
 * @param {string} url - The URL to fetch the code from.
 * @param {string} code - The original code to transform.
 * @return {Promise<Response>} A promise that resolves to the transformed code as a response.
 */
const getTransformCode = async (url: string, code: string) => {
	const { code: _code } = await buildWithRollup(url, code);
	const _response = new Response(
		new Blob([_code], { type: "application/javascript" }),
	);

	// 将处理后的结果存储到缓存中
	await _VPS_CACHE?.put(
		url.replace(/.*\/(apps|packages)/, ""),
		_response.clone(),
	);
	return _response;
};

/**
 * Loads code from a specified URL with provided options.
 *
 * @param {string} url - The URL from which to load the code.
 * @param {RequestInit} options - The options to use when fetching the code.
 * @return {Promise<Response>} A promise that resolves to the fetched code response.
 */
const loadCode = async (url: string, options: RequestInit) => {
	// 从缓存中检索数据
	const _cacheResponse = await _VPS_CACHE?.match(url);

	if (_cacheResponse) {
		// 命中缓存，使用缓存数据
		return _cacheResponse;
	}

	const _res = await fetch(url, options);

	if (
		!_res.ok ||
		jsonCssWasmContentType.test(_res.headers.get("content-type") ?? "")
	)
		return _res;

	const _text = await _res.text();
	if (registerRegEx.test(_text))
		return new Response(new Blob([_text], { type: "application/javascript" }));

	const _code = await getTransformCode(url, _text);
	return _code;
};

/**
 * Initializes the HMR (Hot Module Replacement) event.
 *
 * @return {Object} An object with the `emit` function.
 */
const initHMREvent = () => {
	const _customEvent = new CustomEvent<VPSEmitData>("vps:hot-file-update", {
		detail: {
			file: "",
		},
	});

	const emit = (data: VPSEmitData) => {
		_customEvent.detail.file = data.file;

		window.dispatchEvent(_customEvent);
	};

	window.addEventListener("vps:hot-file-update", (event) => {
		const { file } = (event as CustomEvent<VPSEmitData>).detail;
		const _modules = Array.from<Iterable<[string, unknown]>>(
			System.entries(),
		).filter(([id]) => id.includes(file));

		_modules.forEach(([id], index) => {
			// 删除缓存
			_VPS_CACHE?.delete(id.toString());
			System.delete(id);
			System.import(id).then(() => {
				if (_modules.length - 1 === index) {
					// 刷新页面
					window.location.reload();
				}
			});
		});
	});

	return { emit };
};

openCache();
window.__VPS_HMR = initHMREvent();

systemJSPrototype.shouldFetch = () => true;
systemJSPrototype.fetch = loadCode;
