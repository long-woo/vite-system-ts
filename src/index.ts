import { rollup, type RollupCache } from "@rollup/browser";

const System = require('systemjs');
// let buildCache: RollupCache | undefined = undefined;

const systemJSPrototype = System.constructor.prototype;
const jsonCssWasmContentType =
  /^(application\/json|application\/wasm|text\/css)(;|$)/;
const registerRegEx =
  /System\s*\.\s*register\s*\(\s*(\[[^\]]*\])\s*,\s*\(?function\s*\(\s*([^\\),\s]+\s*(,\s*([^\\),\s]+)\s*)?\s*)?\)/;

const loadRollup = () => {
  const _rollupUrl = 'https://unpkg.com/@rollup/browser/dist/rollup.browser.js';
  // 预加载 rollup wasm 文件
  const _preloadRollupWasmFile = fetch('https://unpkg.com/@rollup/browser/dist/bindings_wasm_bg.wasm').catch(() => {});

  return new Promise((resolve, reject) => {
    const _script = document.createElement('script');

    _script.src = _rollupUrl;
		_script.addEventListener('load', async () => {
			_preloadRollupWasmFile && (await _preloadRollupWasmFile);
			resolve(rollup);
		});
		_script.addEventListener('error', () => {
			reject(
				new Error(`Failed to load ${_rollupUrl}`)
			);
		});
		document.querySelector('head')?.append(_script);
  })
}

const buildWithRollup = async (url: string, code: string) => {
  const _bundle = await rollup({
    input: url,
    // cache: buildCache,
    plugins: [{
      name: 'url-resolver',
      resolveId(source, importer) {
        if (source[0] !== '.') {
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
    }]
  });

  // buildCache = _bundle.cache;
  const { output } = await _bundle.generate({format: 'systemjs', sourcemap: 'inline'});
  return output[0];
}

systemJSPrototype.shouldFetch = function () {
  return true
};

systemJSPrototype.fetch = async (url: string, options: RequestInit) => {
  // const _cache = await caches.open('SYSTEM_BABEL_CACHE');
  // // 从缓存中检索数据
  // const _cacheResponse = await _cache.match(url);
  
  // if (_cacheResponse) {
  //   // 命中缓存，使用缓存数据
  //   return _cacheResponse;
  // }

  const _res = await fetch(url, options);

  if (!_res.ok || jsonCssWasmContentType.test(_res.headers.get('content-type') ?? '')) return _res;

  const _text = await _res.text();
  if (registerRegEx.test(_text)) return new Response(new Blob([_text], { type: 'application/javascript' }));

  const { code } = await buildWithRollup(url, _text);
  const _response = new Response(new Blob([code], { type: 'application/javascript' }));

  // 将处理后的结果存储到缓存中
  // await _cache.put(url, _response.clone());
  return _response;
}