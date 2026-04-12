/**
 * 已知 IDE 清單配置
 * Known IDEs configuration
 *
 * 此檔案定義所有已支援的 IDE 清單，包含各 IDE 的顯示名稱
 * 以及可能使用的資料夾名稱（因安裝方式或版本而異）。
 *
 * 資料夾名稱的優先順序：
 * - 請將最常見或最可能成功的名稱放在前面
 * - 系統會依序嘗試各個名稱
 */
export const knownIDEs = [
	{
		name: 'Visual Studio Code',
		// 標準的 VS Code 資料夾名稱
		// Standard VS Code folder name
		appFolderNames: ['Code'],
	},
	{
		name: 'Visual Studio Code - Insiders',
		// VS Code Insiders 可能使用 "Code - Insiders" 或 "Code-Insiders"
		// VS Code Insiders may use "Code - Insiders" or "Code-Insiders"
		// 重要：空格版本 "Code - Insiders" 應優先嘗試
		// Important: Space version "Code - Insiders" should be tried first
		appFolderNames: ['Code - Insiders', 'Code-Insiders', 'CodeInsiders'],
	},
	{
		name: 'Antigravity',
		appFolderNames: ['Antigravity'],
	},
	{
		name: 'CodeBuddy CN',
		// CodeBuddy CN 可能使用空格或連字符
		// CodeBuddy CN may use spaces or hyphens
		appFolderNames: ['CodeBuddy CN', 'CodeBuddy-CN', 'CodeBuddyCN'],
	},
	{
		name: 'Windsurf',
		// Windsurf 可能的資料夾名稱變化
		// Possible Windsurf folder name variations
		appFolderNames: ['Windsurf'],
	},
] as const;

/**
 * IDE 資料夾名稱配置類型
 * IDE folder names configuration type
 */
export type IKnownIDE = typeof knownIDEs[number];
