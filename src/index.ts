import { rollup } from "@rollup/browser";

const _global = (typeof self !== "undefined" ? self : global) as any;

const systemJSPrototype = _global.System.constructor.prototype;
const jsonCssWasmContentType =
  /^(application\/json|application\/wasm|text\/css)(;|$)/;
const registerRegEx =
  /System\s*\.\s*register\s*\(\s*(\[[^\]]*\])\s*,\s*\(?function\s*\(\s*([^\\),\s]+\s*(,\s*([^\\),\s]+)\s*)?\s*)?\)/;

systemJSPrototype.shouldFetch = function () {
  return true;
};

systemJSPrototype.fetch = async (url: string, options: RequestInit) => {
  const _cache = await caches.open('SYSTEM_BABEL_CACHE');
  // 从缓存中检索数据
  const _cacheResponse = await _cache.match(url);
  
  if (_cacheResponse) {
    // 命中缓存，使用缓存数据
    return _cacheResponse;
  }

  const _res = await fetch(url, options);

  if (!_res.ok || jsonCssWasmContentType.test(_res.headers.get('content-type'))) return _res;

  const _text = await _res.text();
  if (registerRegEx.test(_text)) return new Response(new Blob([_text], { type: 'application/javascript' }));

  const _transform = await babel.transformAsync(_text, {
    filename: url,
    sourceMaps: 'inline',
    ast: false,
    compact: false,
    sourceType: 'module',
    parserOpts: {
      plugins: stage3Syntax,
      errorRecovery: true
    },
    plugins: jtsxUrls.test(url) ? tsxUrls.test(url) ? tsxPlugins : jsxUrls.test(url) ? jsxPlugins : tsPlugins : plugins
  });
  const _code = _transform.code + '\n//# sourceURL=' + url + '!system';
  const _response = new Response(new Blob([_code], { type: 'application/javascript' }));

  // 将处理后的结果存储到缓存中
  await _cache.put(url, _response.clone());
  return _response;
}