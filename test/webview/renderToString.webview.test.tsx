/**
 * SettingsSyncPanel Webview 組件測試
 * SettingsSyncPanel Webview Component Tests
 *
 * 使用 preact-render-to-string 進行測試（Preact 官方推薦方式）
 * Using preact-render-to-string for testing (Preact recommended approach)
 */

/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from 'preact';
import { render as renderToString } from 'preact-render-to-string';
import { SettingsSyncPanelPage } from '../../src/webview/settingsSyncPanel.webview';

/**
 * Mock SettingsSyncPanel 物件
 * Mock SettingsSyncPanel object
 */
const mockSettingsSyncPanel = {
	panel: {
		webview: {
			cspSource: 'vscode-webview://test-csp-source',
		},
	},
} as any;

/**
 * 測試套件：SettingsSyncPanelPage 組件
 * Test Suite: SettingsSyncPanelPage Component
 */
describe('SettingsSyncPanelPage:renderToString', () => {
	/**
	 * 測試：組件能正確渲染基本結構
	 * Test: Component renders basic structure correctly
	 */
	it('should render basic HTML structure', () => {
		const html = renderToString(<SettingsSyncPanelPage />);

		expect(html).toContain('<html');
		expect(html).toContain('</html>');
		expect(html).toContain('<head>');
		expect(html).toContain('</head>');
		expect(html).toContain('<body>');
		expect(html).toContain('</body>');
	});

	/**
	 * 測試：包含正確的 meta 標籤
	 * Test: Contains correct meta tags
	 */
	it('should render meta charset and viewport tags', () => {
		const html = renderToString(<SettingsSyncPanelPage />);

		expect(html).toContain('charset="UTF-8"');
		expect(html).toContain('name="viewport"');
		expect(html).toContain('content="width=device-width, initial-scale=1.0"');
	});

	/**
	 * 測試：包含正確的 title
	 * Test: Contains correct title
	 */
	it('should render correct title', () => {
		const html = renderToString(<SettingsSyncPanelPage />);

		expect(html).toContain('<title>IDE Settings Sync</title>');
	});

	/**
	 * 測試：Content Security Policy 正確設置
	 * Test: Content Security Policy is correctly set
	 */
	it('should render ContentSecurityPolicy with correct CSP source', () => {
		const html = renderToString(<SettingsSyncPanelPage settingsSyncPanel={mockSettingsSyncPanel} />);

		expect(html).toContain('http-equiv="Content-Security-Policy"');
		expect(html).toContain("default-src 'none'");
		expect(html).toContain('vscode-webview://test-csp-source');
	});

	/**
	 * 測試：Content Security Policy 包含所有必要的指令
	 * Test: Content Security Policy contains all required directives
	 */
	it('should include all required CSP directives', () => {
		const html = renderToString(<SettingsSyncPanelPage settingsSyncPanel={mockSettingsSyncPanel} />);

		const cspMatch = html.match(/content="([^"]*)"/);
		expect(cspMatch).toBeTruthy();

		const cspContent = cspMatch![1];
		expect(cspContent).toContain("default-src 'none'");
		expect(cspContent).toContain('img-src');
		expect(cspContent).toContain('style-src');
		expect(cspContent).toContain('script-src');
		expect(cspContent).toContain('connect-src');
		expect(cspContent).toContain("'unsafe-inline'");
	});

	/**
	 * 測試：正確渲染 CSS 內容
	 * Test: Renders CSS content correctly
	 */
	it('should render CSS content in style tag', () => {
		const cssContent = 'body { background: red; }';
		const html = renderToString(<SettingsSyncPanelPage cssContent={cssContent} />);

		// 檢查 style 標籤包含 CSS 內容
		expect(html).toContain('<style>');
		expect(html).toContain(cssContent);
		expect(html).toContain('</style>');
	});

	/**
	 * 測試：包含兩個 script 標籤
	 * Test: Contains two script tags
	 */
	it('should render two script tags', () => {
		const html = renderToString(<SettingsSyncPanelPage />);

		const scriptMatches = html.match(/<script>/g);
		expect(scriptMatches).toHaveLength(2);
	});

	/**
	 * 測試：靜態 HTML 輸出可以與 DOCTYPE 結合使用
	 * Test: Static HTML output can be combined with DOCTYPE
	 */
	it('should render to string that can be wrapped with DOCTYPE', () => {
		const html = `<!DOCTYPE html>${renderToString(<SettingsSyncPanelPage />)}`;

		expect(html).toMatch(/^<!DOCTYPE html>/i);
		expect(html).toContain('<html');
		expect(html).toContain('</html>');
	});

	/**
	 * 測試：完整渲染快照
	 * Test: Full render snapshot
	 */
	it('should match snapshot with all props', () => {
		const html = `<!DOCTYPE html>${renderToString(
			<SettingsSyncPanelPage
				settingsSyncPanel={mockSettingsSyncPanel}
				cssContent={'/* test css */'}
			/>
		)}`;

		expect(html).toMatchSnapshot();
	});

	/**
	 * 測試：無 settingsSyncPanel 時正確處理 CSP
	 * Test: Handles missing settingsSyncPanel gracefully for CSP
	 */
	it('should handle missing settingsSyncPanel prop', () => {
		const html = renderToString(<SettingsSyncPanelPage />);

		// 即使沒有 settingsSyncPanel，組件仍應正確渲染基本結構
		expect(html).toContain('<html');
		expect(html).toContain('<head>');
		expect(html).toContain('<body>');
	});

	/**
	 * 測試：CSP 在無 cspSource 時使用預設值
	 * Test: CSP uses default values when cspSource is not provided
	 */
	it('should render CSP even without cspSource', () => {
		const html = renderToString(<SettingsSyncPanelPage />);

		// 應該仍然有 CSP meta 標籤，即使沒有 cspSource
		expect(html).toContain('http-equiv="Content-Security-Policy"');
	});
});
