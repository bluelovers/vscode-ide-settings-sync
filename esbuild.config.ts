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
	external: ['vscode', 'jsonc-parser'],
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
