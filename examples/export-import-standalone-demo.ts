/**
 * 匯出匯入功能獨立演示
 * Export/Import Functionality Standalone Demo
 *
 * 展示匯出匯入功能的核心邏輯，不依賴 VSCode API
 * Demonstrates core logic of export/import functionality without VSCode API dependencies
 */

import { ExportImportType, IExportImportData, IImportOptions } from '../src/types';

// Mock VSCode context for demonstration
class MockExportImportService {
	private customIDEs: Array<{ name: string; path: string }>;
	private selectedSettings: Record<string, boolean>;
	private readonly VERSION = '1.0.0';

	constructor(customIDEs: Array<{ name: string; path: string }>, selectedSettings: Record<string, boolean>) {
		this.customIDEs = customIDEs;
		this.selectedSettings = selectedSettings;
	}

	/**
	 * 匯出自訂 IDE
	 * Export custom IDEs
	 */
	async exportCustomIDEs(): Promise<string> {
		const exportData: IExportImportData = {
			version: this.VERSION,
			exportedAt: new Date().toISOString(),
			exportedBy: 'VSCode IDE Settings Sync',
			type: ExportImportType.customIDEs,
			customIDEs: this.customIDEs.map(ide => ({
				name: ide.name,
				path: ide.path,
				exportedAt: new Date().toISOString(),
				detected: false,
			})),
			metadata: {
				totalCustomIDEs: this.customIDEs.length,
				totalSelectedSettings: 0,
				knownIDEsExcluded: ['Visual Studio Code', 'Windsurf', 'Antigravity', 'CodeBuddy CN'],
			},
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * 匯出選擇的設定
	 * Export selected settings
	 */
	async exportSelectedSettings(): Promise<string> {
		const exportSettings = Object.entries(this.selectedSettings)
			.filter(([_, selected]) => selected)
			.map(([key, _]) => ({
				key,
				display: this.getSettingDisplay(key),
				description: this.getSettingDescription(key),
				values: {},
				exportedAt: new Date().toISOString(),
			}));

		const exportData: IExportImportData = {
			version: this.VERSION,
			exportedAt: new Date().toISOString(),
			exportedBy: 'VSCode IDE Settings Sync',
			type: ExportImportType.selectedSettings,
			selectedSettings: exportSettings,
			metadata: {
				totalCustomIDEs: 0,
				totalSelectedSettings: exportSettings.length,
				knownIDEsExcluded: ['Visual Studio Code', 'Windsurf', 'Antigravity', 'CodeBuddy CN'],
			},
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * 匯出所有資料
	 * Export all data
	 */
	async exportAll(): Promise<string> {
		const exportSettings = Object.entries(this.selectedSettings)
			.filter(([_, selected]) => selected)
			.map(([key, _]) => ({
				key,
				display: this.getSettingDisplay(key),
				description: this.getSettingDescription(key),
				values: {},
				exportedAt: new Date().toISOString(),
			}));

		const exportData: IExportImportData = {
			version: this.VERSION,
			exportedAt: new Date().toISOString(),
			exportedBy: 'VSCode IDE Settings Sync',
			type: ExportImportType.both,
			customIDEs: this.customIDEs.map(ide => ({
				name: ide.name,
				path: ide.path,
				exportedAt: new Date().toISOString(),
				detected: false,
			})),
			selectedSettings: exportSettings,
			metadata: {
				totalCustomIDEs: this.customIDEs.length,
				totalSelectedSettings: exportSettings.length,
				knownIDEsExcluded: ['Visual Studio Code', 'Windsurf', 'Antigravity', 'CodeBuddy CN'],
			},
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * 匯入資料
	 * Import data
	 */
	async importData(jsonData: string, options: IImportOptions) {
		const result = {
			success: true,
			importedCustomIDEs: 0,
			importedSelectedSettings: 0,
			skippedCustomIDEs: 0,
			skippedSelectedSettings: 0,
			errors: [] as string[],
			warnings: [] as string[],
		};

		try {
			const data: IExportImportData = JSON.parse(jsonData);

			// Validate version compatibility
			if (!this.isVersionCompatible(data.version)) {
				result.success = false;
				result.errors.push(`不支援的版本: ${data.version}`);
				return result;
			}

			// Import custom IDEs
			if (options.includeCustomIDEs && data.customIDEs) {
				await this.importCustomIDEs(data.customIDEs, options, result);
			}

			// Import selected settings
			if (options.includeSelectedSettings && data.selectedSettings) {
				await this.importSelectedSettings(data.selectedSettings, options, result);
			}

		} catch (error) {
			result.success = false;
			result.errors.push(`匯入失敗: ${error instanceof Error ? error.message : String(error)}`);
		}

		return result;
	}

	/**
	 * 匯入自訂 IDE
	 * Import custom IDEs
	 */
	private async importCustomIDEs(
		customIDEs: any[], 
		options: IImportOptions, 
		result: any
	): Promise<void> {
		const existingNames = new Set(this.customIDEs.map(ide => ide.name));
		const knownIDENames = new Set(['Visual Studio Code', 'Windsurf', 'Antigravity', 'CodeBuddy CN']);

		for (const customIDE of customIDEs) {
			// Skip known IDEs if option is enabled
			if (options.excludeKnownIDEs && knownIDENames.has(customIDE.name)) {
				result.skippedCustomIDEs++;
				result.warnings.push(`跳過已知 IDE: ${customIDE.name}`);
				continue;
			}

			// Skip if already exists and overwrite is disabled
			if (existingNames.has(customIDE.name) && !options.overwriteExisting) {
				result.skippedCustomIDEs++;
				result.warnings.push(`跳過已存在的自訂 IDE: ${customIDE.name}`);
				continue;
			}

			// Add custom IDE
			this.customIDEs.push({
				name: customIDE.name,
				path: customIDE.path,
			});
			result.importedCustomIDEs++;
		}
	}

	/**
	 * 匯入選擇的設定
	 * Import selected settings
	 */
	private async importSelectedSettings(
		selectedSettings: any[], 
		options: IImportOptions, 
		result: any
	): Promise<void> {
		// Filter settings based on selected keys if provided
		const settingsToImport = options.selectedSettingKeys
			? selectedSettings.filter(setting => options.selectedSettingKeys!.includes(setting.key))
			: selectedSettings;

		for (const setting of settingsToImport) {
			// Skip if already exists and overwrite is disabled
			if (this.selectedSettings[setting.key] !== undefined && !options.overwriteExisting) {
				result.skippedSelectedSettings++;
				result.warnings.push(`跳過已存在的設定: ${setting.key}`);
				continue;
			}

			// Add selected setting
			this.selectedSettings[setting.key] = true;
			result.importedSelectedSettings++;
		}
	}

	/**
	 * 檢查版本相容性
	 * Check version compatibility
	 */
	private isVersionCompatible(version: string): boolean {
		const supportedVersions = ['1.0.0'];
		return supportedVersions.includes(version);
	}

	/**
	 * 取得設定顯示名稱
	 * Get setting display name
	 */
	private getSettingDisplay(key: string): string {
		return key.split('.').map(part => 
			part.charAt(0).toUpperCase() + part.slice(1)
		).join(' ');
	}

	/**
	 * 取得設定描述
	 * Get setting description
	 */
	private getSettingDescription(key: string): string {
		return `Setting for ${key}`;
	}

	// Getters for current state
	getCurrentCustomIDEs() {
		return [...this.customIDEs];
	}

	getCurrentSelectedSettings() {
		return { ...this.selectedSettings };
	}
}

async function demonstrateExportImport() {
	console.log('🔧 匯出匯入功能獨立演示 / Export/Import Functionality Standalone Demo\n');

	// 設置測試資料
	// Setup test data
	const initialCustomIDEs = [
		{ name: 'My Custom IDE 1', path: '/path/to/my-ide-1' },
		{ name: 'My Custom IDE 2', path: '/path/to/my-ide-2' },
		{ name: 'Development IDE', path: '/dev/ide' },
	];

	const initialSelectedSettings = {
		'editor.fontSize': true,
		'editor.fontFamily': true,
		'editor.wordWrap': true,
		'workbench.colorTheme': false,
		'terminal.integrated.shell': false,
	};

	const service = new MockExportImportService(initialCustomIDEs, initialSelectedSettings);

	try {
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
		
		if (importResult.warnings.length > 0) {
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
		if (!invalidResult.success) {
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
		if (!incompatibleResult.success) {
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

		// 演示 7: 設定選擇功能
		// Demo 7: Setting selection functionality
		console.log('\n=== 演示 7: 設定選擇功能 / Demo 7: Setting Selection Functionality ===');
		
		const selectiveOptions: IImportOptions = {
			includeCustomIDEs: false,
			includeSelectedSettings: true,
			excludeKnownIDEs: false,
			selectedSettingKeys: ['editor.fontSize', 'editor.fontFamily'], // 只匯入這兩個設定
			overwriteExisting: true,
		};
		
		const selectiveResult = await service.importData(selectedSettingsExport, selectiveOptions);
		console.log(`選擇性匯入 / Selective Import: ${selectiveResult.importedSelectedSettings} 匯入, ${selectiveResult.skippedSelectedSettings} 跳過`);

		// 顯示最終狀態
		// Show final state
		console.log('\n=== 最終狀態 / Final State ===');
		const finalCustomIDEs = service.getCurrentCustomIDEs();
		const finalSelectedSettings = service.getCurrentSelectedSettings();
		
		console.log(`最終自訂 IDE 數量 / Final Custom IDEs Count: ${finalCustomIDEs.length}`);
		finalCustomIDEs.forEach((ide, index) => {
			console.log(`  ${index + 1}. ${ide.name} - ${ide.path}`);
		});
		
		console.log(`最終選擇設定數量 / Final Selected Settings Count: ${Object.keys(finalSelectedSettings).filter(key => finalSelectedSettings[key]).length}`);

		console.log('\n✅ 匯出匯入功能演示完成 / Export/Import Functionality Demo Completed!');
		return true;

	} catch (error) {
		console.error('❌ 演示失敗 / Demo Failed:', error);
		return false;
	}
}

// 如果直接運行此檔案，執行演示
// If this file is run directly, execute the demo
if (require.main === module) {
	demonstrateExportImport().then((success) => {
		process.exit(success ? 0 : 1);
	}).catch((error) => {
		console.error('❌ 未捕獲的錯誤 / Uncaught Error:', error);
		process.exit(1);
	});
}

export { demonstrateExportImport, MockExportImportService };
