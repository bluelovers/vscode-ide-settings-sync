/**
 * Export/Import 組件測試
 * Export/Import Component Tests
 *
 * 測試 webview/src/components/ 下的匯出/匯入相關組件。
 * Tests export/import related components under webview/src/components/.
 */

/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from 'preact';
import { render as renderToString } from 'preact-render-to-string';
import { IImportResult } from '../../webview/src/types';

/**
 * Mock vscode API for tests (ExportImportPanel imports from scripts which import vscode)
 */
jest.mock('../../webview/src/global/vscode-api', () => ({
	vscode: {
		postMessage: jest.fn(),
		getState: jest.fn(),
		setState: jest.fn(),
	},
}));

jest.mock('../../webview/src/index', () => ({
	vscode: {
		postMessage: jest.fn(),
		getState: jest.fn(),
		setState: jest.fn(),
	},
}));

jest.mock('../../webview/src/store', () => ({
	exportPath: { value: '' },
	importPath: { value: '' },
	activeTab: { value: 'sync' },
	sourceIDEUuid: { value: '' },
	sourceIDEName: { value: '' },
	ideList: { value: [] },
	searchQuery: { value: '' },
	checkedSettingKeys: { value: new Set() },
}));

describe('ExportImportPanel Components', () =>
{
	describe('PathInput Component', () =>
	{
		it('should render path input with browse button', () =>
		{
			const { PathInput } = require('../../webview/src/components/export-import/PathInput');
			const html = renderToString(
				<PathInput
					id="test-path"
					placeholder="Test placeholder"
					onBrowse={() => {}}
				/>,
			);

			expect(html).toContain('path-input-group');
			expect(html).toContain('id="test-path"');
			expect(html).toContain('Test placeholder');
			expect(html).toContain('📁 Browse');
		});

		it('should render with inputRef prop', () =>
		{
			const { PathInput } = require('../../webview/src/components/export-import/PathInput');
			const html = renderToString(
				<PathInput
					id="test-path"
					placeholder="Test placeholder"
					onBrowse={() => {}}
				/>,
			);

			expect(html).toContain('id="test-path"');
			expect(html).toContain('class="path-input"');
		});
	});

	describe('CheckboxOption Component', () =>
	{
		it('should render checkbox with label', () =>
		{
			const { CheckboxOption } = require('../../webview/src/components/export-import/CheckboxOption');
			const html = renderToString(
				<CheckboxOption
					id="test-checkbox"
					label="Test label"
				/>,
			);

			expect(html).toContain('checkbox-group');
			expect(html).toContain('id="test-checkbox"');
			expect(html).toContain('Test label');
		});

		it('should render with checked state', () =>
		{
			const { CheckboxOption } = require('../../webview/src/components/export-import/CheckboxOption');
			const html = renderToString(
				<CheckboxOption
					id="test-checkbox"
					label="Test label"
					checked={true}
				/>,
			);

			expect(html).toContain('checked');
		});
	});

	describe('ActionButton Component', () =>
	{
		it('should render action button', () =>
		{
			const { ActionButton } = require('../../webview/src/components/export-import/ActionButton');
			const html = renderToString(
				<ActionButton
					onClick={() => {}}
					title="Test button"
				>
					Test Text
				</ActionButton>,
			);

			expect(html).toContain('btn action-btn');
			expect(html).toContain('Test Text');
			expect(html).toContain('title="Test button"');
		});

		it('should render disabled state', () =>
		{
			const { ActionButton } = require('../../webview/src/components/export-import/ActionButton');
			const html = renderToString(
				<ActionButton
					onClick={() => {}}
					disabled={true}
				>
					Test Text
				</ActionButton>,
			);

			expect(html).toContain('disabled');
		});

		it('should render processing state', () =>
		{
			const { ActionButton } = require('../../webview/src/components/export-import/ActionButton');
			const html = renderToString(
				<ActionButton
					onClick={() => {}}
					processing={true}
				>
					Test Text
				</ActionButton>,
			);

			expect(html).toContain('processing');
			expect(html).toContain('⏳ Processing...');
		});
	});

	describe('ExportImportPanel Main Component', () =>
	{
		it('should render export/import sections', () =>
		{
			const { ExportImportPanel } = require('../../webview/src/components/ExportImportPanel');
			const html = renderToString(
				<ExportImportPanel />,
			);

			expect(html).toContain('export-import-section');
			expect(html).toContain('Export Custom IDEs');
			expect(html).toContain('Export Selected Settings');
			expect(html).toContain('Export All Settings');
			expect(html).toContain('Import Settings');
		});

		it('should render with import result', () =>
		{
			const { ExportImportPanel } = require('../../webview/src/components/ExportImportPanel');
			const mockImportResult: IImportResult = {
				success: true,
				importedCustomIDEs: 2,
				importedSelectedSettings: 5,
				skippedCustomIDEs: 0,
				skippedSelectedSettings: 0,
				errors: [],
				warnings: [],
			};

			const html = renderToString(
				<ExportImportPanel importResult={mockImportResult} />,
			);

			expect(html).toContain('import-result');
			expect(html).toContain('✅ Import successful!');
		});

		it('should render processing state', () =>
		{
			const { ExportImportPanel } = require('../../webview/src/components/ExportImportPanel');
			const html = renderToString(
				<ExportImportPanel isProcessing={true} />,
			);

			expect(html).toContain('processing');
			expect(html).toContain('⏳ Processing...');
		});

		it('should not include inline script tags (JS logic is in webview bundle)', () =>
		{
			/**
			 * ExportImportPanel 不應包含 inline <script> 標籤，
			 * 所有 JS 邏輯由 webview bundle（dist/webview/index.js）提供。
			 * ExportImportPanel should not contain inline <script> tags;
			 * all JS logic is provided by the webview bundle (dist/webview/index.js).
			 */
			const { ExportImportPanel } = require('../../webview/src/components/ExportImportPanel');
			const html = renderToString(
				<ExportImportPanel />,
			);

			expect(html).not.toContain('<script');
		});
	});
});
