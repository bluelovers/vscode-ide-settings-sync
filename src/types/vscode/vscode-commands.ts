/**
 * vscode-ide-settings-sync, ide-sync 定義於 package.json 的 contributes.commands
 * vscode-ide-settings-sync, ide-sync commands defined in package.json contributes.commands
 */
export const enum EnumVscodeCommands
{
	/** 開啟同步設定介面 / Open sync settings interface */
	openSync = 'vscode-ide-settings-sync.openSync',

	/** 同步選取的設定項目 / Sync selected settings items */
	syncSelectedSettings = 'vscode-ide-settings-sync.syncSelectedSettings',

	/** 配置語言設定 / Configure language settings */
	configLanguage = 'vscode-ide-settings-sync.configLanguage',

	/** 重新整理已知 IDE 清單 / Refresh known IDE list */
	refreshIDEs = 'vscode-ide-settings-sync.refreshIDEs',

	/** 執行完整同步設定 / Execute full sync settings */
	syncSettings = 'vscode-ide-settings-sync.syncSettings',

	/** 匯出自訂 IDE 清單 / Export custom IDE list */
	exportCustomIDEs = 'ide-sync.exportCustomIDEs',

	/** 匯出選取的設定項目 / Export selected settings items */
	exportSelectedSettings = 'ide-sync.exportSelectedSettings',

	/** 匯出所有設定與資料 / Export all settings and data */
	exportAll = 'ide-sync.exportAll',

	/** 匯入設定與資料 / Import settings and data */
	import = 'ide-sync.import',

	/**
	 * VS Code 內建命令：在檔案總管中開啟檔案
	 * VS Code built-in command: Reveal file in OS file explorer
	 */
	revealFileInOS = 'revealFileInOS'
}
