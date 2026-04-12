/**
 * Export/Import 組件測試
 * Export/Import Component Tests
 */

/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from 'preact';
import { render as renderToString } from 'preact-render-to-string';
import { ExportImportPanel } from '../../src/webview/components/ExportImportPanel';
import { IImportResult } from '../../src/types';

describe('ExportImportPanel Components', () =>
{
	describe('PathInput Component', () =>
	{
		it('should render path input with browse button', () =>
		{
			const { PathInput } = require('../../src/webview/components/export-import/PathInput');
			const html = renderToString(
				<PathInput
					id="test-path"
					placeholder="Test placeholder"
					onBrowse="handleBrowseTest()"
				/>,
			);

			expect(html).toContain('path-input-group');
			expect(html).toContain('id="test-path"');
			expect(html).toContain('Test placeholder');
			expect(html).toContain('📁 Browse');
			expect(html).toContain('handleBrowseTest()');
		});

		it('should render with default browse handler', () =>
		{
			const { PathInput } = require('../../src/webview/components/export-import/PathInput');
			const html = renderToString(
				<PathInput
					id="test-path"
					placeholder="Test placeholder"
				/>,
			);

			expect(html).toContain('handleBrowsePath()');
		});
	});

	describe('CheckboxOption Component', () =>
	{
		it('should render checkbox with label', () =>
		{
			const { CheckboxOption } = require('../../src/webview/components/export-import/CheckboxOption');
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
			const { CheckboxOption } = require('../../src/webview/components/export-import/CheckboxOption');
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

	describe('ActionBtn Component', () =>
	{
		it('should render action button', () =>
		{
			const { ActionBtn } = require('../../src/webview/components/export-import/ActionBtn');
			const html = renderToString(
				<ActionBtn
					onClick="handleTest()"
					title="Test button"
				>
					Test Text
				</ActionBtn>,
			);

			expect(html).toContain('btn action-btn');
			expect(html).toContain('handleTest()');
			expect(html).toContain('Test Text');
			expect(html).toContain('title="Test button"');
		});

		it('should render disabled state', () =>
		{
			const { ActionBtn } = require('../../src/webview/components/export-import/ActionBtn');
			const html = renderToString(
				<ActionBtn
					onClick="handleTest()"
					disabled={true}
				>
					Test Text
				</ActionBtn>,
			);

			expect(html).toContain('disabled');
		});

		it('should render processing state', () =>
		{
			const { ActionBtn } = require('../../src/webview/components/export-import/ActionBtn');
			const html = renderToString(
				<ActionBtn
					onClick="handleTest()"
					processing={true}
				>
					Test Text
				</ActionBtn>,
			);

			expect(html).toContain('processing');
			expect(html).toContain('⏳ Processing...');
		});
	});

	describe('ExportImportPanel Main Component', () =>
	{
		it('should render export/import sections', () =>
		{
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
			const html = renderToString(
				<ExportImportPanel isProcessing={true} />,
			);

			expect(html).toContain('processing');
			expect(html).toContain('⏳ Processing...');
		});

		it('should include ExportImportScript', () =>
		{
			const html = renderToString(
				<ExportImportPanel />,
			);

			expect(html).toContain('<script');
			expect(html).toContain('handleExportCustomIDEs');
			expect(html).toContain('handleImport');
			expect(html).toContain('window.addEventListener');
		});
	});
});
