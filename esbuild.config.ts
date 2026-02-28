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
 * 主配置
 */
const config: BuildOptions = {
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
 * 處理 --minify 參數（用於 vscode:prepublish）
 */
const args = process.argv.slice(2);
if (args.includes('--minify')) {
	config.minify = true;
}

/**
 * 處理 --watch 參數（用於 esbuild-watch）
 */
if (args.includes('--watch')) {
	config.watch = {
		onRebuild(error, result) {
			if (error) {
				console.error('Build failed:', error);
			} else {
				console.log('Build succeeded, watching for changes...');
			}
		},
	};
}

// 確保輸出目錄存在
ensureOutDir(config.outfile);

// 直接執行構建
esbuild.build(config).then(() => {
	console.log('Build completed successfully');
}).catch((error: Error) => {
	console.error('Build failed:', error);
	process.exit(1);
});
