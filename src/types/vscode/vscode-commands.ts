
/**
 * vscode-ide-settings-sync, ide-sync 定義於 package.json 的 contributes.commands
 */
export const enum EnumVscodeCommands
{
	openSync = 'vscode-ide-settings-sync.openSync',
	syncSelectedSettings = 'vscode-ide-settings-sync.syncSelectedSettings',
	configLanguage = 'vscode-ide-settings-sync.configLanguage',
	refreshIDEs = 'vscode-ide-settings-sync.refreshIDEs',
	syncSettings = 'vscode-ide-settings-sync.syncSettings',

	exportCustomIDEs = 'ide-sync.exportCustomIDEs',
	exportSelectedSettings = 'ide-sync.exportSelectedSettings',
	exportAll = 'ide-sync.exportAll',
	import = 'ide-sync.import',

	/**
	 * VS Code 內建命令：在檔案總管中開啟檔案
	 * VS Code built-in command: Reveal file in OS file explorer
	 */
	revealFileInOS = 'revealFileInOS'
}
