/**
 * 匯出匯入服務
 * Export/Import Service
 *
 * 處理 CustomIDEs 和選擇設定的匯出匯入功能
 * Handles export/import functionality for CustomIDEs and selected settings
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
	ExportImportType,
	IExportImportData,
	ICustomIDEExport,
	ISelectedSettingExport,
	IImportOptions,
	IImportResult,
	EnumGlobalStateName,
} from '../types';
import { knownIDEs } from '../data/knownIDEs';

export class ExportImportService
{
	private context: vscode.ExtensionContext;
	private readonly VERSION = '1.0.0';

	constructor(context: vscode.ExtensionContext)
	{
		this.context = context;
	}

	/**
	 * 匯出自訂 IDE 清單
	 * Export custom IDEs list
	 */
	async exportCustomIDEs(): Promise<string>
	{
		const customIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
			EnumGlobalStateName.customIDEs,
			[],
		);

		const exportData: IExportImportData = {
			version: this.VERSION,
			exportedAt: new Date().toISOString(),
			exportedBy: 'VSCode IDE Settings Sync',
			type: ExportImportType.customIDEs,
			customIDEs: customIDEs.map(ide => ({
				name: ide.name,
				path: ide.path,
				exportedAt: new Date().toISOString(),
				detected: false, // Will be updated during import
			})),
			metadata: {
				totalCustomIDEs: customIDEs.length,
				totalSelectedSettings: 0,
				knownIDEsExcluded: knownIDEs.map(ide => ide.name),
			},
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * 匯出選擇的設定清單
	 * Export selected settings list
	 */
	async exportSelectedSettings(): Promise<string>
	{
		const selectedSettings = this.context.globalState.get<Record<string, boolean>>(
			EnumGlobalStateName.selectedSettings,
			{},
		);

		// Convert selected settings to export format
		const exportSettings: ISelectedSettingExport[] = Object.entries(selectedSettings)
			.filter(([_, selected]) => selected)
			.map(([key, _]) => ({
				key,
				display: this.getSettingDisplay(key),
				description: this.getSettingDescription(key),
				values: {}, // Will be populated with actual values during export
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
				knownIDEsExcluded: knownIDEs.map(ide => ide.name),
			},
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * 匯出自訂 IDE 和選擇設定
	 * Export both custom IDEs and selected settings
	 */
	async exportAll(): Promise<string>
	{
		const customIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
			EnumGlobalStateName.customIDEs,
			[],
		);

		const selectedSettings = this.context.globalState.get<Record<string, boolean>>(
			EnumGlobalStateName.selectedSettings,
			{},
		);

		const exportSettings: ISelectedSettingExport[] = Object.entries(selectedSettings)
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
			customIDEs: customIDEs.map(ide => ({
				name: ide.name,
				path: ide.path,
				exportedAt: new Date().toISOString(),
				detected: false,
			})),
			selectedSettings: exportSettings,
			metadata: {
				totalCustomIDEs: customIDEs.length,
				totalSelectedSettings: exportSettings.length,
				knownIDEsExcluded: knownIDEs.map(ide => ide.name),
			},
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * 匯入設定
	 * Import settings
	 */
	async importData(jsonData: string, options: IImportOptions): Promise<IImportResult>
	{
		const result: IImportResult = {
			success: true,
			importedCustomIDEs: 0,
			importedSelectedSettings: 0,
			skippedCustomIDEs: 0,
			skippedSelectedSettings: 0,
			errors: [],
			warnings: [],
		};

		try
		{
			const data: IExportImportData = JSON.parse(jsonData);

			// Validate version compatibility
			if (!this.isVersionCompatible(data.version))
			{
				result.success = false;
				result.errors.push(`不支援的版本: ${data.version}`);
				return result;
			}

			// Import custom IDEs
			if (options.includeCustomIDEs && data.customIDEs)
			{
				await this.importCustomIDEs(data.customIDEs, options, result);
			}

			// Import selected settings
			if (options.includeSelectedSettings && data.selectedSettings)
			{
				await this.importSelectedSettings(data.selectedSettings, options, result);
			}

		}
		catch (error)
		{
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
		customIDEs: ICustomIDEExport[],
		options: IImportOptions,
		result: IImportResult,
	): Promise<void>
	{
		const existingCustomIDEs = this.context.globalState.get<Array<{ name: string; path: string }>>(
			EnumGlobalStateName.customIDEs,
			[],
		);

		const existingNames = new Set(existingCustomIDEs.map(ide => ide.name));
		const knownIDENames = new Set(knownIDEs.map(ide => ide.name as string));

		for (const customIDE of customIDEs)
		{
			// Skip known IDEs if option is enabled
			if (options.excludeKnownIDEs && knownIDENames.has(customIDE.name))
			{
				result.skippedCustomIDEs++;
				result.warnings.push(`跳過已知 IDE: ${customIDE.name}`);
				continue;
			}

			// Skip if already exists and overwrite is disabled
			if (existingNames.has(customIDE.name) && !options.overwriteExisting)
			{
				result.skippedCustomIDEs++;
				result.warnings.push(`跳過已存在的自訂 IDE: ${customIDE.name}`);
				continue;
			}

			// Add or update custom IDE
			const updatedCustomIDEs = existingCustomIDEs.filter(ide => ide.name !== customIDE.name);
			updatedCustomIDEs.push({
				name: customIDE.name,
				path: customIDE.path,
			});

			await this.context.globalState.update(EnumGlobalStateName.customIDEs, updatedCustomIDEs);
			result.importedCustomIDEs++;
		}
	}

	/**
	 * 匯入選擇的設定
	 * Import selected settings
	 */
	private async importSelectedSettings(
		selectedSettings: ISelectedSettingExport[],
		options: IImportOptions,
		result: IImportResult,
	): Promise<void>
	{
		const existingSelectedSettings = this.context.globalState.get<Record<string, boolean>>(
			EnumGlobalStateName.selectedSettings,
			{},
		);

		// Filter settings based on selected keys if provided
		const settingsToImport = options.selectedSettingKeys
			? selectedSettings.filter(setting => options.selectedSettingKeys!.includes(setting.key))
			: selectedSettings;

		for (const setting of settingsToImport)
		{
			// Skip if already exists and overwrite is disabled
			if (existingSelectedSettings[setting.key] !== undefined && !options.overwriteExisting)
			{
				result.skippedSelectedSettings++;
				result.warnings.push(`跳過已存在的設定: ${setting.key}`);
				continue;
			}

			// Add or update selected setting
			existingSelectedSettings[setting.key] = true;
			result.importedSelectedSettings++;
		}

		await this.context.globalState.update(EnumGlobalStateName.selectedSettings, existingSelectedSettings);
	}

	/**
	 * 檢查版本相容性
	 * Check version compatibility
	 */
	private isVersionCompatible(version: string): boolean
	{
		// Simple version check - in real implementation, might be more complex
		const supportedVersions = ['1.0.0'];
		return supportedVersions.includes(version);
	}

	/**
	 * 取得設定顯示名稱
	 * Get setting display name
	 */
	private getSettingDisplay(key: string): string
	{
		// This would be implemented based on actual setting definitions
		// For now, return the key as display name
		return key.split('.').map(part =>
			part.charAt(0).toUpperCase() + part.slice(1),
		).join(' ');
	}

	/**
	 * 取得設定描述
	 * Get setting description
	 */
	private getSettingDescription(key: string): string
	{
		// This would be implemented based on actual setting definitions
		// For now, return a generic description
		return `Setting for ${key}`;
	}

	/**
	 * 顯示匯入選項對話框
	 * Show import options dialog
	 */
	async showImportOptionsDialog(data: IExportImportData): Promise<IImportOptions | undefined>
	{
		const options: vscode.QuickPickItem[] = [];

		// Add options based on data type
		if (data.customIDEs && data.customIDEs.length > 0)
		{
			options.push({
				label: '$(file-directory) 匯入自訂 IDE',
				description: `匯入 ${data.customIDEs.length} 個自訂 IDE`,
				picked: true,
			});
		}

		if (data.selectedSettings && data.selectedSettings.length > 0)
		{
			options.push({
				label: '$(gear) 匯入選擇的設定',
				description: `匯入 ${data.selectedSettings.length} 個選擇的設定`,
				picked: true,
			});
		}

		if (options.length === 0)
		{
			vscode.window.showWarningMessage('匯入檔案中沒有可匯入的資料');
			return undefined;
		}

		const selectedOptions = await vscode.window.showQuickPick(options, {
			placeHolder: '選擇要匯入的項目',
			canPickMany: true,
		});

		if (!selectedOptions || selectedOptions.length === 0)
		{
			return undefined;
		}

		const includeCustomIDEs = selectedOptions.some(option =>
			option.label.includes('自訂 IDE'),
		);
		const includeSelectedSettings = selectedOptions.some(option =>
			option.label.includes('選擇的設定'),
		);

		// Show additional options
		const advancedOptions = await vscode.window.showQuickPick([
			{
				label: '$(check) 排除內建 IDE',
				description: '自動排除已知的內建 IDE',
				picked: true,
			},
			{
				label: '$(discard) 覆蓋現有設定',
				description: '覆蓋已存在的自訂 IDE 和設定',
				picked: false,
			},
		], {
			placeHolder: '選擇進階選項',
			canPickMany: true,
		});

		const excludeKnownIDEs = advancedOptions?.some(option =>
			option.label.includes('排除內建 IDE'),
		) ?? true;
		const overwriteExisting = advancedOptions?.some(option =>
			option.label.includes('覆蓋現有設定'),
		) ?? false;

		// If selected settings, show setting selection dialog
		let selectedSettingKeys: string[] | undefined;
		if (includeSelectedSettings && data.selectedSettings)
		{
			selectedSettingKeys = await this.showSettingSelectionDialog(data.selectedSettings);
		}

		return {
			includeCustomIDEs,
			includeSelectedSettings,
			excludeKnownIDEs,
			selectedSettingKeys,
			overwriteExisting,
		};
	}

	/**
	 * 顯示設定選擇對話框
	 * Show setting selection dialog
	 */
	private async showSettingSelectionDialog(
		settings: ISelectedSettingExport[],
	): Promise<string[] | undefined>
	{
		const quickPickItems: vscode.QuickPickItem[] = settings.map(setting => ({
			label: setting.key,
			description: setting.display,
			detail: setting.description,
			picked: true,
		}));

		// Add action buttons
		const allButton = { label: '$(check-all) 全選', description: '選擇所有設定' };
		const noneButton = { label: '$(x) 取消選取', description: '取消選擇所有設定' };
		const invertButton = { label: '$(diff) 反選', description: '反轉選擇' };

		const selectedItems = await vscode.window.showQuickPick(
			[allButton, noneButton, invertButton, ...quickPickItems],
			{
				placeHolder: '選擇要匯入的設定 (可使用搜尋過濾)',
				canPickMany: true,
				matchOnDescription: true,
				matchOnDetail: true,
			},
		);

		if (!selectedItems)
		{
			return undefined;
		}

		// Handle action buttons
		if (selectedItems.includes(allButton))
		{
			return settings.map(s => s.key);
		}
		else if (selectedItems.includes(noneButton))
		{
			return [];
		}
		else if (selectedItems.includes(invertButton))
		{
			// Invert selection (simplified - would need more complex logic for actual implementation)
			return settings.filter(s => !selectedItems.some(item => item.label === s.key)).map(s => s.key);
		}

		// Return selected setting keys
		return selectedItems
			.filter(item => !item.label.includes('全選') && !item.label.includes('取消選取') && !item.label.includes('反選'))
			.map(item => item.label);
	}

	/**
	 * 儲存匯出檔案
	 * Save export file
	 */
	async saveExportFile(content: string, defaultName: string): Promise<string | undefined>
	{
		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', defaultName)),
			filters: {
				'JSON Files': ['json'],
				'All Files': ['*'],
			},
		});

		if (uri)
		{
			try
			{
				fs.writeFileSync(uri.fsPath, content, 'utf8');
				vscode.window.showInformationMessage(`匯出成功: ${uri.fsPath}`);
				return uri.fsPath;
			}
			catch (error)
			{
				vscode.window.showErrorMessage(`儲存失敗: ${error instanceof Error ? error.message : String(error)}`);
			}
		}

		return undefined;
	}

	/**
	 * 讀取匯入檔案
	 * Read import file
	 */
	async readImportFile(): Promise<string | undefined>
	{
		const uri = await vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: '匯入',
			filters: {
				'JSON Files': ['json'],
				'All Files': ['*'],
			},
		});

		if (uri && uri[0])
		{
			try
			{
				const content = fs.readFileSync(uri[0].fsPath, 'utf8');
				return content;
			}
			catch (error)
			{
				vscode.window.showErrorMessage(`讀取失敗: ${error instanceof Error ? error.message : String(error)}`);
			}
		}

		return undefined;
	}
}
