/**
 * 語言設定模組
 * Language configuration module
 *
 * 從 DOM 讀取語言選擇值，由 window 掛載後供 onchange 字串呼叫。
 * Reads language selection value from DOM, mounted to window for onchange string calls.
 */

import { vscode } from '../global/vscode-api';
import { activeTab } from '../store';
import { EnumWebviewCommand } from '../webviewMessages';

/**
 * 變更主顯示語言
 * Change the primary display language
 *
 * 可接受直接傳入的 value（來自 onchange="changePrimaryLanguage(this.value)"），
 * 或從 DOM 讀取（向後相容）。
 * Accepts value passed directly (from onchange="changePrimaryLanguage(this.value)"),
 * or reads from DOM (backward compatible).
 *
 * @param value - 語言代碼（可選，若未提供則從 DOM 讀取）/ Language code (optional, reads from DOM if not provided)
 */
export function changePrimaryLanguage(value?: string): void
{
	const lang = value ?? (document.getElementById('primaryLang') as HTMLSelectElement | null)?.value;
	if (!lang) return;

	vscode.postMessage({ command: EnumWebviewCommand.ChangePrimaryLanguage, language: lang });
}

export function openLanguageConfig(): void
{
	vscode.postMessage({ command: EnumWebviewCommand.OpenLanguageConfig });
}
