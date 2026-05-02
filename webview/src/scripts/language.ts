/**
 * 語言設定模組
 * Language configuration module
 */

import { vscode } from '../index';
import { EnumWebviewCommand } from '../webviewMessages';

export function changePrimaryLanguage(): void
{
	const select = document.getElementById('primaryLang') as HTMLSelectElement | null;
	const newLang = select?.value;
	if (!newLang) return;

	vscode.postMessage({ command: EnumWebviewCommand.ChangePrimaryLanguage, language: newLang });

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

export function openLanguageConfig(): void
{
	vscode.postMessage({ command: EnumWebviewCommand.OpenLanguageConfig });
}
