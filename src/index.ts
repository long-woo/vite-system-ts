import { rollup } from "@rollup/browser";

const { System } = require('systemjs');
// const  _global = (typeof self !== "undefined" ? self : global) as any;

const systemJSPrototype = System.constructor.prototype;
const jsonCssWasmContentType =
  /^(application\/json|application\/wasm|text\/css)(;|$)/;
const registerRegEx =
  /System\s*\.\s*register\s*\(\s*(\[[^\]]*\])\s*,\s*\(?function\s*\(\s*([^\\),\s]+\s*(,\s*([^\\),\s]+)\s*)?\s*)?\)/;

systemJSPrototype.shouldFetch = function () {
  return true;
};

systemJSPrototype.fetch = async (url: string, options: RequestInit) => {
  // const _cache = await caches.open('SYSTEM_BABEL_CACHE');
  // // 从缓存中检索数据
  // const _cacheResponse = await _cache.match(url);
  
  // if (_cacheResponse) {
  //   // 命中缓存，使用缓存数据
  //   return _cacheResponse;
  // }

  const _bundle = await rollup({
    input: url,
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
      async load(id) {
        const _response = await fetch(id);

        return _response.text();
      },
    }]
  });

  const { output } = await _bundle.generate({format: 'systemjs', sourcemap: 'inline'});
  console.log(output);

  // const _res = await fetch(url, options);

  // if (!_res.ok || jsonCssWasmContentType.test(_res.headers.get('content-type'))) return _res;

  // const _text = await _res.text();
  // if (registerRegEx.test(_text)) return new Response(new Blob([_text], { type: 'application/javascript' }));

  // const _transform = await rollup({
  //   input: url
  // });
  // (await _transform.generate({})).output
  // const _code = _transform.code + '\n//# sourceURL=' + url + '!system';
  // const _response = new Response(new Blob([_code], { type: 'application/javascript' }));

  // // 将处理后的结果存储到缓存中
  // await _cache.put(url, _response.clone());
  return '';
}