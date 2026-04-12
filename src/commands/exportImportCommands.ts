/**
 * 匯出匯入命令
 * Export/Import Commands
 *
 * 處理匯出匯入相關的 VSCode 命令
 * Handles VSCode commands for export/import functionality
 */

import * as vscode from 'vscode';
import { ExportImportService } from '../services/exportImportService';
import { ExportImportType } from '../types';

export class ExportImportCommands
{
	private exportImportService: ExportImportService;

	constructor(context: vscode.ExtensionContext)
	{
		this.exportImportService = new ExportImportService(context);
		this.registerCommands(context);
	}

	/**
	 * 註冊所有命令
	 * Register all commands
	 */
	private registerCommands(context: vscode.ExtensionContext): void
	{
		// Export commands
		const exportCustomIDEsCommand = vscode.commands.registerCommand(
			'ide-sync.exportCustomIDEs',
			() => this.exportCustomIDEs(),
		);

		const exportSelectedSettingsCommand = vscode.commands.registerCommand(
			'ide-sync.exportSelectedSettings',
			() => this.exportSelectedSettings(),
		);

		const exportAllCommand = vscode.commands.registerCommand(
			'ide-sync.exportAll',
			() => this.exportAll(),
		);

		// Import commands
		const importCommand = vscode.commands.registerCommand(
			'ide-sync.import',
			() => this.import(),
		);

		// Register commands
		context.subscriptions.push(
			exportCustomIDEsCommand,
			exportSelectedSettingsCommand,
			exportAllCommand,
			importCommand,
		);
	}

	/**
	 * 匯出自訂 IDE
	 * Export custom IDEs
	 */
	private async exportCustomIDEs(): Promise<void>
	{
		try
		{
			const content = await this.exportImportService.exportCustomIDEs();
			const fileName = `custom-ides-export-${new Date().toISOString().split('T')[0]}.json`;
			await this.exportImportService.saveExportFile(content, fileName);
		}
		catch (error)
		{
			vscode.window.showErrorMessage(
				`匯出自訂 IDE 失敗: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * 匯出選擇的設定
	 * Export selected settings
	 */
	private async exportSelectedSettings(): Promise<void>
	{
		try
		{
			const content = await this.exportImportService.exportSelectedSettings();
			const fileName = `selected-settings-export-${new Date().toISOString().split('T')[0]}.json`;
			await this.exportImportService.saveExportFile(content, fileName);
		}
		catch (error)
		{
			vscode.window.showErrorMessage(
				`匯出選擇的設定失敗: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * 匯出所有資料
	 * Export all data
	 */
	private async exportAll(): Promise<void>
	{
		try
		{
			const content = await this.exportImportService.exportAll();
			const fileName = `ide-sync-export-${new Date().toISOString().split('T')[0]}.json`;
			await this.exportImportService.saveExportFile(content, fileName);
		}
		catch (error)
		{
			vscode.window.showErrorMessage(
				`匯出所有資料失敗: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * 匯入資料
	 * Import data
	 */
	private async import(): Promise<void>
	{
		try
		{
			const content = await this.exportImportService.readImportFile();
			if (!content)
			{
				return;
			}

			// Parse and validate the import data
			let data;
			try
			{
				data = JSON.parse(content);
			}
			catch (parseError)
			{
				vscode.window.showErrorMessage('無效的 JSON 檔案格式');
				return;
			}

			// Show import options dialog
			const options = await this.exportImportService.showImportOptionsDialog(data);
			if (!options)
			{
				return;
			}

			// Perform import
			const result = await this.exportImportService.importData(content, options);

			// Show result
			await this.showImportResult(result);
		}
		catch (error)
		{
			vscode.window.showErrorMessage(
				`匯入失敗: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * 顯示匯入結果
	 * Show import result
	 */
	private async showImportResult(result: any): Promise<void>
	{
		if (result.success)
		{
			let message = '匯入成功！';
			const details: string[] = [];

			if (result.importedCustomIDEs > 0)
			{
				details.push(`匯入 ${result.importedCustomIDEs} 個自訂 IDE`);
			}

			if (result.importedSelectedSettings > 0)
			{
				details.push(`匯入 ${result.importedSelectedSettings} 個選擇的設定`);
			}

			if (result.skippedCustomIDEs > 0)
			{
				details.push(`跳過 ${result.skippedCustomIDEs} 個自訂 IDE`);
			}

			if (result.skippedSelectedSettings > 0)
			{
				details.push(`跳過 ${result.skippedSelectedSettings} 個選擇的設定`);
			}

			if (details.length > 0)
			{
				message += ` (${details.join(', ')})`;
			}

			vscode.window.showInformationMessage(message);

			// Show warnings if any
			if (result.warnings && result.warnings.length > 0)
			{
				const showWarnings = await vscode.window.showWarningMessage(
					'匯入過程中有一些警告，是否查看詳細資訊？',
					'查看詳細資訊',
					'忽略',
				);

				if (showWarnings === '查看詳細資訊')
				{
					const warningDoc = await vscode.workspace.openTextDocument({
						content: result.warnings.join('\n'),
						language: 'text',
					});
					await vscode.window.showTextDocument(warningDoc);
				}
			}
		}
		else
		{
			let message = '匯入失敗';
			if (result.errors && result.errors.length > 0)
			{
				message += `: ${result.errors.join(', ')}`;
			}
			vscode.window.showErrorMessage(message);
		}
	}
}
