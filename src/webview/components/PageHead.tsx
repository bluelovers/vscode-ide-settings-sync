import { h } from 'preact';
import { IContentSecurityPolicyProps, ISettingsSyncPanelPagePropsRuntime } from './types';

/**
 * Content Security Policy (CSP) 元件
 * 用於定義 Webview 的資源載入安全策略
 *
 * @param props - CSP 配置屬性，需至少提供 panel 或 cspSource 其中之一
 * @returns 渲染 CSP meta 標籤
 */
export const ContentSecurityPolicy = (props: IContentSecurityPolicyProps) =>
{
	/**
	 * 取得 CSP 來源網址
	 * 優先使用直接傳入的 cspSource，若未提供則從 panel 的 webview 屬性取得
	 */
	const cspSource = props.cspSource ?? props.panel?.webview.cspSource;

	/**
	 * CSP 策略配置陣列
	 * 定義各類資源的載入來源限制，防止 XSS 等安全威脅
	 *
	 * 策略說明：
	 * - default-src 'none': 預設拒絕所有資源載入，作為基礎安全層級
	 * - img-src: 允許從 webview 自身 (cspSource) 和任意 HTTPS 來源載入圖片
	 * - style-src: 允許 inline styles，因 Preact 渲染機制需要
	 * - script-src: 允許 inline scripts 和 eval，因 Preact/JSX 轉譯需要
	 * - connect-src: 僅允許向 webview 自身發起連線請求
	 */
	const csp = [
		`default-src 'none'`,
		`img-src ${cspSource} https:`,
		`style-src ${cspSource} 'unsafe-inline'`,
		`script-src ${cspSource} 'unsafe-inline' 'unsafe-eval'`,
		`connect-src ${cspSource}`,
	].join('; ');

	return <meta http-equiv="Content-Security-Policy" content={csp} />;
};

/**
 * 頁面頭部元件
 * 負責渲染 Webview HTML 的 <head> 區塊，包含字符編碼、CSP、視口設定、標題和樣式
 *
 * @param props - 頁面屬性，包含 settingsSyncPanel 實例和 CSS 內容
 * @returns 渲染完整的 head 元素
 */
export const PageHead = (props: ISettingsSyncPanelPagePropsRuntime) =>
{
	/**
	 * SettingsSyncPanel 實例引用
	 * 使用非空斷言確保面板實例已正確初始化
	 */
	const self = props.settingsSyncPanel!;

	return (<head>
		{/* 字符編碼設定：使用 UTF-8 確保多語言文字正確顯示 */}
		<meta charset="UTF-8" />

		{/*
			內容安全策略 (CSP)
			限制資源載入來源，防止惡意腳本注入
			從 webview 實例取得 cspSource 作為信任來源
		*/}
		<ContentSecurityPolicy cspSource={self?.panel?.webview?.cspSource} />

		{/* 響應式視口設定：確保在不同裝置上正確縮放 */}
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />

		{/* 頁面標題：顯示在瀏覽器/IDE 標籤頁上 */}
		<title>IDE Settings Sync</title>

		{/*
			內嵌樣式表
			動態注入編譯後的 CSS 內容，確保樣式與擴充功能版本一致
		*/}
		<style>
			{props.cssContent}
		</style>
	</head>);
};
