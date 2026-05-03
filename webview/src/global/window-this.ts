/**
 * window 函數掛載模組（瀏覽器端專用）
 * Window function mounting module (browser-side only)
 *
 * 此檔案在瀏覽器環境中將必要函數掛載至 window，
 * 僅由 `index.tsx`（瀏覽器 bundle 入口）import，不得在 SSR 路徑中 import。
 *
 * This file mounts necessary functions to window in browser environments.
 * Only imported by `index.tsx` (browser bundle entry), must NOT be imported in SSR paths.
 */

import { removeFromSelectedSettings } from '../scripts/settings';
import { saveSearchHistory, addSelectedSettingsListOnSearchPanel, addSelectedSettingsListOnAllPanel, saveSelectedIDEs } from '../scripts/memory';
import { showMessage } from '../scripts/messages';
import { IWebviewWindow } from './window-types';

export type { IWebviewWindow };

const extendsApi = {
	removeFromSelectedSettings,
	saveSearchHistory,
	addSelectedSettingsListOnSearchPanel,
	addSelectedSettingsListOnAllPanel,
	saveSelectedIDEs,
	showMessage,
};

/**
 * 將函數掛載至 window（僅在瀏覽器環境執行）
 * Mount functions to window (only executes in browser environment)
 */
export const globalThisWindow = typeof window !== 'undefined'
	? Object.assign(window, extendsApi) as IWebviewWindow
	: undefined;
