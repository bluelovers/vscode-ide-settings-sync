/**
 * 匯出匯入功能演示
 * Export/Import Functionality Demo
 *
 * 展示如何使用匯出匯入服務
 * Demonstrates how to use the export/import service
 */

import { ExportImportService } from '../src/services/exportImportService';
import { ExportImportType, IImportOptions } from '../src/types';

// Mock VSCode context for demonstration
const mockContext = {
	globalState: {
		get: jest.fn(),
		update: jest.fn(),
	},
};

async function demonstrateExportImport()
{
	console.log('🔧 匯出匯入功能演示 / Export/Import Functionality Demo\n');

	const service = new ExportImportService(mockContext as any);

	// 設置測試資料
	// Setup test data
	mockContext.globalState.get.mockImplementation((key: string) => {
		switch (key)
		{
			case 'customIDEs':
				return [
					{ name: 'My Custom IDE 1', path: '/path/to/my-ide-1' },
					{ name: 'My Custom IDE 2', path: '/path/to/my-ide-2' },
					{ name: 'Development IDE', path: '/dev/ide' },
				];
			case 'selectedSettings':
				return {
					'editor.fontSize': true,
					'editor.fontFamily': true,
					'editor.wordWrap': true,
					'workbench.colorTheme': false,
					'terminal.integrated.shell': false,
				};
			default:
				return {};
		}
	});

	try
	{
		// 演示 1: 匯出自訂 IDE
		// Demo 1: Export custom IDEs
		console.log('=== 演示 1: 匯出自訂 IDE / Demo 1: Export Custom IDEs ===');
		const customIDEsExport = await service.exportCustomIDEs();
		const customIDEsData = JSON.parse(customIDEsExport);
		
		console.log(`匯出類型 / Export Type: ${customIDEsData.type}`);
		console.log(`版本 / Version: ${customIDEsData.version}`);
		console.log(`自訂 IDE 數量 / Custom IDEs Count: ${customIDEsData.customIDEs?.length}`);
		console.log(`匯出時間 / Export Time: ${customIDEsData.exportedAt}`);
		
		customIDEsData.customIDEs?.forEach((ide: any, index: number) => {
			console.log(`  ${index + 1}. ${ide.name} - ${ide.path}`);
		});

		// 演示 2: 匯出選擇的設定
		// Demo 2: Export selected settings
		console.log('\n=== 演示 2: 匯出選擇的設定 / Demo 2: Export Selected Settings ===');
		const selectedSettingsExport = await service.exportSelectedSettings();
		const selectedSettingsData = JSON.parse(selectedSettingsExport);
		
		console.log(`匯出類型 / Export Type: ${selectedSettingsData.type}`);
		console.log(`選擇設定數量 / Selected Settings Count: ${selectedSettingsData.selectedSettings?.length}`);
		
		selectedSettingsData.selectedSettings?.forEach((setting: any, index: number) => {
			console.log(`  ${index + 1}. ${setting.key} - ${setting.display}`);
		});

		// 演示 3: 匯出所有資料
		// Demo 3: Export all data
		console.log('\n=== 演示 3: 匯出所有資料 / Demo 3: Export All Data ===');
		const allExport = await service.exportAll();
		const allData = JSON.parse(allExport);
		
		console.log(`匯出類型 / Export Type: ${allData.type}`);
		console.log(`總計 / Total: ${allData.metadata?.totalCustomIDEs} IDEs, ${allData.metadata?.totalSelectedSettings} Settings`);
		console.log(`排除的內建 IDE / Excluded Built-in IDEs: ${allData.metadata?.knownIDEsExcluded.join(', ')}`);

		// 演示 4: 匯入資料
		// Demo 4: Import data
		console.log('\n=== 演示 4: 匯入資料 / Demo 4: Import Data ===');
		
		const importOptions: IImportOptions = {
			includeCustomIDEs: true,
			includeSelectedSettings: true,
			excludeKnownIDEs: true,
			overwriteExisting: false,
		};

		const importResult = await service.importData(allExport, importOptions);
		
		console.log(`匯入成功 / Import Success: ${importResult.success}`);
		console.log(`匯入的自訂 IDE / Imported Custom IDEs: ${importResult.importedCustomIDEs}`);
		console.log(`匯入的選擇設定 / Imported Selected Settings: ${importResult.importedSelectedSettings}`);
		console.log(`跳過的自訂 IDE / Skipped Custom IDEs: ${importResult.skippedCustomIDEs}`);
		console.log(`跳過的選擇設定 / Skipped Selected Settings: ${importResult.skippedSelectedSettings}`);
		
		if (importResult.warnings.length > 0)
		{
			console.log(`警告 / Warnings:`);
			importResult.warnings.forEach((warning, index) => {
				console.log(`  ${index + 1}. ${warning}`);
			});
		}

		// 演示 5: 錯誤處理
		// Demo 5: Error handling
		console.log('\n=== 演示 5: 錯誤處理 / Demo 5: Error Handling ===');
		
		// 測試無效 JSON
		// Test invalid JSON
		const invalidResult = await service.importData('invalid json', importOptions);
		console.log(`無效 JSON 測試 / Invalid JSON Test: ${invalidResult.success ? '成功' : '失敗'}`);
		if (!invalidResult.success)
		{
			console.log(`錯誤 / Error: ${invalidResult.errors.join(', ')}`);
		}

		// 測試版本不相容
		// Test version incompatibility
		const incompatibleData = {
			version: '2.0.0',
			type: ExportImportType.customIDEs,
			exportedAt: new Date().toISOString(),
			exportedBy: 'Demo',
			customIDEs: [],
		};
		
		const incompatibleResult = await service.importData(JSON.stringify(incompatibleData), importOptions);
		console.log(`版本不相容測試 / Version Incompatibility Test: ${incompatibleResult.success ? '成功' : '失敗'}`);
		if (!incompatibleResult.success)
		{
			console.log(`錯誤 / Error: ${incompatibleResult.errors.join(', ')}`);
		}

		// 演示 6: 進階匯入選項
		// Demo 6: Advanced import options
		console.log('\n=== 演示 6: 進階匯入選項 / Demo 6: Advanced Import Options ===');
		
		// 只匯入自訂 IDE
		// Import only custom IDEs
		const customIDEsOnlyOptions: IImportOptions = {
			includeCustomIDEs: true,
			includeSelectedSettings: false,
			excludeKnownIDEs: true,
			overwriteExisting: true,
		};
		
		const customIDEsOnlyResult = await service.importData(customIDEsExport, customIDEsOnlyOptions);
		console.log(`只匯入自訂 IDE / Custom IDEs Only: ${customIDEsOnlyResult.importedCustomIDEs} 匯入, ${customIDEsOnlyResult.skippedCustomIDEs} 跳過`);

		// 只匯入選擇設定
		// Import only selected settings
		const settingsOnlyOptions: IImportOptions = {
			includeCustomIDEs: false,
			includeSelectedSettings: true,
			excludeKnownIDEs: false,
			overwriteExisting: true,
		};
		
		const settingsOnlyResult = await service.importData(selectedSettingsExport, settingsOnlyOptions);
		console.log(`只匯入選擇設定 / Settings Only: ${settingsOnlyResult.importedSelectedSettings} 匯入, ${settingsOnlyResult.skippedSelectedSettings} 跳過`);

		console.log('\n✅ 匯出匯入功能演示完成 / Export/Import Functionality Demo Completed!');
		return true;

	}
	catch (error)
	{
		console.error('❌ 演示失敗 / Demo Failed:', error);
		return false;
	}
}

// 如果直接運行此檔案，執行演示
// If this file is run directly, execute the demo
if (require.main === module)
{
	demonstrateExportImport().then((success) => {
		process.exit(success ? 0 : 1);
	}).catch((error) => {
		console.error('❌ 未捕獲的錯誤 / Uncaught Error:', error);
		process.exit(1);
	});
}

export { demonstrateExportImport };
