/**
 * 側邊欄 Webview View Provider
 * Sidebar Webview View Provider
 *
 * 在 Activity Bar（側邊欄）註冊一個按鈕/圖示，點擊後顯示側邊欄視圖，
 * 並自動開啟主要的 IDE Settings Sync 面板。
 *
 * Registers a button/icon in the Activity Bar (sidebar); clicking it shows a
 * sidebar view and automatically opens the main IDE Settings Sync panel.
 */

import * as vscode from 'vscode';
import { EnumVscodeCommands } from '../types/vscode/vscode-commands';

export class SettingsSyncSidebarProvider implements vscode.WebviewViewProvider
{
	/** 對應 package.json contributes.views 的 view id / View id from contributes.views */
	public static readonly viewType = 'vscodeIdeSettingsSyncView';

	protected context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext)
	{
		this.context = context;
	}

	/**
	 * 解析並建立側邊欄 Webview View
	 * Resolve and create the sidebar Webview View
	 *
	 * 當使用者在 Activity Bar 點擊本擴充的圖示時，VS Code 會呼叫此方法。
	 * 設定 Webview 選項與 HTML，並監聽來自視圖的訊息。
	 *
	 * When the user clicks this extension's icon in the Activity Bar,
	 * VS Code calls this method. It sets webview options and HTML,
	 * and listens for messages from the view.
	 *
	 * @param webviewView - VS Code 提供的 WebviewView 實例 / WebviewView instance provided by VS Code
	 */
	public resolveWebviewView(webviewView: vscode.WebviewView): void
	{
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
		};

		webviewView.webview.html = this.getHtml();

		/**
		 * 監聽側邊欄視圖發送的訊息，處理「開啟面板」請求
		 * Listen for messages from the sidebar view, handling the "open panel" request
		 */
		webviewView.webview.onDidReceiveMessage((message) =>
		{
			if (message?.command === 'openPanel')
			{
				vscode.commands.executeCommand(EnumVscodeCommands.openSync);
			}
		});

		/**
		 * 自動開啟主面板：點擊側邊欄圖示即開啟 IDE Settings Sync 面板
		 * Auto-open the main panel: clicking the sidebar icon opens the panel
		 */
		vscode.commands.executeCommand(EnumVscodeCommands.openSync);
	}

	/**
	 * 產生側邊欄視圖的 HTML 內容
	 * Generate the HTML content of the sidebar view
	 *
	 * 使用 VS Code 主題變數（--vscode-*）確保在各個 IDE 主題下皆可閱讀。
	 * Uses VS Code theme variables (--vscode-*) to stay readable under any IDE theme.
	 */
	protected getHtml(): string
	{
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<style>
		body {
			padding: 16px;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			color: var(--vscode-foreground);
			background-color: transparent;
		}
		h3 {
			margin-top: 0;
			font-weight: 600;
		}
		p {
			line-height: 1.5;
			opacity: 0.9;
		}
		button {
			display: block;
			width: 100%;
			margin-top: 12px;
			padding: 6px 12px;
			border: 1px solid var(--vscode-button-border, transparent);
			border-radius: 3px;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			font-size: 13px;
			font-weight: 600;
			cursor: pointer;
		}
		button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
	</style>
</head>
<body>
	<div class="sidebar">
		<h3>IDE Settings Sync</h3>
		<p>點擊此按鈕或下方的圖示，開啟 IDE Settings Sync 面板以同步與備份跨 IDE 的設定。</p>
		<button id="openPanelBtn">Open Panel</button>
	</div>
	<script>
		(function () {
			const vscode = acquireVsCodeApi();
			document.getElementById('openPanelBtn').addEventListener('click', function () {
				vscode.postMessage({ command: 'openPanel' });
			});
		}());
	</script>
</body>
</html>`;
	}
}