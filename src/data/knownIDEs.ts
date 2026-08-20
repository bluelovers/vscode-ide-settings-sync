/**
 * 已知 IDE 清單配置
 * Known IDEs configuration
 *
 * 此檔案定義所有已支援的 IDE 清單，包含各 IDE 的顯示名稱
 * 以及可能使用的資料夾名稱（因安裝方式或版本而異）。
 * This file defines all supported IDE list, including each IDE's display name
 * and possible folder names used (varies by installation method or version).
 *
 * 資料夾名稱的優先順序：
 * Priority order of folder names:
 * - 請將最常見或最可能成功的名稱放在前面
 *   Place the most common or most likely successful names first
 * - 系統會依序嘗試各個名稱
 *   System will try each name in order
 *
 * 範例：
 * Example:
 * - C:\Users\User\AppData\Roaming\<IDE Folder Name>\User
 */
export const knownIDEs = [
	{
		/** IDE 顯示名稱，用於介面展示 / IDE display name, used for UI display */
		name: 'Visual Studio Code',
		/**
		 * 可能的資料夾名稱列表，依常見程度排序
		 * Possible folder names list, ordered by commonness
		 *
		 * 這是 VS Code 穩定版的預設資料夾名稱，最常見
		 * This is the default folder name for VS Code stable version, most common
		 */
		appFolderNames: ['Code'],
	},
	{
		/** IDE 顯示名稱，用於介面展示 / IDE display name, used for UI display */
		name: 'Visual Studio Code - Insiders',
		/**
		 * 可能的資料夾名稱列表，依常見程度排序
		 * Possible folder names list, ordered by commonness
		 *
		 * Insiders 版本因安裝方式不同可能產生不同資料夾名稱
		 * Insiders version may have different folder names due to different installation methods
		 *
		 * 重要：空格版本 "Code - Insiders" 應優先嘗試（最常見）
		 * Important: Space version "Code - Insiders" should be tried first (most common)
		 */
		appFolderNames: ['Code - Insiders', 'Code-Insiders', 'CodeInsiders'],
	},
	{
		/** IDE 顯示名稱，用於介面展示 / IDE display name, used for UI display */
		name: 'Antigravity',
		/**
		 * 可能的資料夾名稱列表，依常見程度排序
		 * Possible folder names list, ordered by commonness
		 *
		 * Antigravity 預設資料夾名稱
		 * Antigravity default folder name
		 */
		appFolderNames: ['Antigravity'],
	},
	{
		/** IDE 顯示名稱，用於介面展示 / IDE display name, used for UI display */
		name: 'CodeBuddy CN',
		/**
		 * 可能的資料夾名稱列表，依常見程度排序
		 * Possible folder names list, ordered by commonness
		 *
		 * CodeBuddy CN 因安裝版本或地區設定不同可能產生不同資料夾名稱
		 * CodeBuddy CN may have different folder names due to installation version or region settings
		 */
		appFolderNames: ['CodeBuddy CN', 'CodeBuddy-CN', 'CodeBuddyCN'],
	},
	{
		/** IDE 顯示名稱，用於介面展示 / IDE display name, used for UI display */
		name: 'Windsurf',
		/**
		 * 可能的資料夾名稱列表，依常見程度排序
		 * Possible folder names list, ordered by commonness
		 *
		 * Windsurf 預設資料夾名稱
		 * Windsurf default folder name
		 */
		appFolderNames: ['Windsurf'],
	},
	{
		/** IDE 顯示名稱，用於介面展示 / IDE display name, used for UI display */
		name: 'kiro',
		/**
		 * 可能的資料夾名稱列表，依常見程度排序
		 * Possible folder names list, ordered by commonness
		 *
		 * Kiro 可能使用大小寫不同的資料夾名稱
		 * Kiro may use case-different folder names
		 */
		appFolderNames: ['Kiro', 'kiro']
	},
	{
		/** IDE 顯示名稱，用於介面展示 / IDE display name, used for UI display */
		name: 'Cursor',
		/**
		 * 可能的資料夾名稱列表，依常見程度排序
		 * Possible folder names list, ordered by commonness
		 *
		 * Cursor 預設資料夾名稱
		 * Cursor default folder name
		 */
		appFolderNames: ['Cursor'],
	},
	{
		/** IDE 顯示名稱，用於介面展示 / IDE display name, used for UI display */
		name: 'Devin',
		/**
		 * 可能的資料夾名稱列表，依常見程度排序
		 * Possible folder names list, ordered by commonness
		 *
		 * Devin 預設資料夾名稱
		 * Devin default folder name
		 */
		appFolderNames: ['Devin'],
	}
] as const satisfies I_KnownIDE[];

interface I_KnownIDE
{
	name: string;
	appFolderNames: readonly string[],
}

/**
 * IDE 資料夾名稱配置類型
 * IDE folder names configuration type
 *
 * 從 knownIDEs 常數推導出的類型，代表單個 IDE 的配置項目
 * Type derived from knownIDEs constant, represents single IDE configuration item
 */
export type IKnownIDE = typeof knownIDEs[number];
