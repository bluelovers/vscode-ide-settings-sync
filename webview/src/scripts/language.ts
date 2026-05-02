/**
 * 語言設定模組
 * Language configuration module
 *
 * 處理主顯示語言的切換，以及開啟語言設定面板的指令。
 * Handles switching the primary display language and the command to open the language configuration panel.
 */

import { vscode } from '../index';

/**
 * 讀取 `#primaryLang` 下拉選單的選取值，
 * 向 Extension host 發送 `changePrimaryLanguage` 指令，
 * 並立即重新渲染當前分頁的設定列表以反映新語言的描述。
 *
 * Read the selected value from the `#primaryLang` dropdown,
 * post a `changePrimaryLanguage` command to the Extension host,
 * and immediately re-render the current tab's settings list to reflect the new language descriptions.
 */
export function changePrimaryLanguage(): void
{
	const select = document.getElementById('primaryLang') as HTMLSelectElement | null;
	const newLang = select?.value;
	if (!newLang) return;

	vscode.postMessage({ command: 'changePrimaryLanguage', language: newLang });

	/**
	 * 根據當前啟用的分頁決定重新渲染哪個設定列表
	 * Decide which settings list to re-render based on the currently active tab
	 *
	 * 透過 `window` 存取以避免與 settings.ts 產生循環依賴（circular dependency）。
	 * Accessed via `window` to avoid circular dependency with settings.ts.
	 */
	const activeTab = document.querySelector('.tab.active');
	if (activeTab?.textContent?.includes('All'))
	{
		(window as any).displayAllSettings?.();
	}
	else
	{
		(window as any).searchSettings?.();
	}
}

/**
 * 透過 VS Code 擴充功能指令開啟語言設定面板
 * Open the language configuration panel via VS Code extension command
 */
export function openLanguageConfig(): void
{
	vscode.postMessage({ command: 'openLanguageConfig' });
}
