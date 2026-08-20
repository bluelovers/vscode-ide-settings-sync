/**
 * esbuild 構建配置腳本
 * esbuild build configuration script for VSCode extension
 */
import esbuild, { BuildOptions } from 'esbuild';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { sassPlugin } from 'esbuild-sass-plugin';

/** 確保輸出目錄存在 */
function ensureOutDir(outfile: string) {
	const dir = dirname(outfile);
	if (!existsSync(dir)) {
		mkdirSync(dir, {
			recursive: true,
		});
	}
}

/**
 * Extension bundle 配置（Node.js / CJS）
 */
const extensionConfig: BuildOptions = {
	entryPoints: ['./src/extension.ts'],
	bundle: true,
	outfile: 'dist/extension.js',
	/**
	 * 僅將 vscode 設為 external：VS Code 執行期會提供 vscode 模組。
	 * 其餘相依（如 jsonc-parser）必須全部 bundle 進 dist/extension.js，
	 * 因為發佈時使用 `--no-dependencies`，VSIX 內不含 node_modules。
	 *
	 * Only vscode is kept external: the VS Code runtime provides the vscode module.
	 * All other dependencies (e.g. jsonc-parser) must be bundled into dist/extension.js
	 * because the extension is published with `--no-dependencies` (no node_modules in the VSIX).
	 */
	external: ['vscode'],
	/**
	 * jsonc-parser 的 package.json main 指向 UMD build，其內層 factory 中的
	 * `require("./impl/format")` 無法被 esbuild 靜態解析，會殘留相對 require，
	 * 造成執行期 `Cannot find module './impl/format'`。
	 * 改為 alias 至 ESM build（靜態 import），可完整 bundle 進 dist/extension.js。
	 *
	 * jsonc-parser's main points to the UMD build, whose inner factory
	 * `require("./impl/format")` calls cannot be statically resolved by esbuild,
	 * leaving relative requires behind and causing `Cannot find module './impl/format'`.
	 * Alias to the ESM build (static imports) so it bundles fully into dist/extension.js.
	 */
	alias: {
		'jsonc-parser': require.resolve('jsonc-parser/lib/esm/main.js'),
	},
	format: 'cjs',
	platform: 'node',
	target: 'node18',
	sourcemap: 'both',
	jsxFactory: 'h',
	jsxFragment: 'Fragment',
	plugins: [
		sassPlugin({
			// 關鍵設定：將 scss 轉換為 css 字串
			type: "css-text",
		}),
	],
};

/**
 * Webview bundle 配置（Browser / IIFE）
 */
const webviewConfig: BuildOptions = {
	entryPoints: ['./webview/src/index.tsx'],
	bundle: true,
	outfile: 'dist/webview/index.js',
	external: [],
	format: 'iife',
	platform: 'browser',
	target: 'es2020',
	sourcemap: 'both',
	jsx: 'automatic',
	jsxImportSource: 'preact',
	plugins: [
		sassPlugin({
			type: "css-text",
		}),
	],
};

/**
 * 處理 --minify 參數（用於 vscode:prepublish）
 */
const args = process.argv.slice(2);
const shouldMinify = args.includes('--minify');
const shouldWatch = args.includes('--watch');

if (shouldMinify) {
	extensionConfig.minify = true;
	webviewConfig.minify = true;
}

// 確保輸出目錄存在
ensureOutDir(extensionConfig.outfile as string);
ensureOutDir(webviewConfig.outfile as string);

/**
 * 處理 --watch 參數（使用 esbuild.context() API）
 */
if (shouldWatch) {
	Promise.all([
		esbuild.context(extensionConfig),
		esbuild.context(webviewConfig),
	]).then(async ([extensionCtx, webviewCtx]) => {
		await Promise.all([
			extensionCtx.watch(),
			webviewCtx.watch(),
		]);
		console.log('Watching for changes (extension + webview)...');
	}).catch((error: Error) => {
		console.error('Watch setup failed:', error);
		process.exit(1);
	});
} else {
	// 直接執行雙 bundle 構建
	Promise.all([
		esbuild.build(extensionConfig),
		esbuild.build(webviewConfig),
	]).then(() => {
		console.log('Build completed successfully (extension + webview)');
	}).catch((error: Error) => {
		console.error('Build failed:', error);
		process.exit(1);
	});
}
