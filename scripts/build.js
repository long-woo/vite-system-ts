import * as esbuild from 'esbuild';
import { importAsGlobals } from '../esbuild-plugin/ImportAsGlobals'

const result = await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  target: 'es2015',
  packages: 'external',
  plugins: [importAsGlobals({
    '@rollup/browser': 'rollup',
    systemjs: 'System'
  })]
});

if (result.errors.length) {
  console.error(result.errors.toString());
  process.exit(1);
}

console.info('⚡️ Build success!');
