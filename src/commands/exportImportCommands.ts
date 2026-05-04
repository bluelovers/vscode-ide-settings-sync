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
import { EnumVscodeCommands } from '../types/vscode/vscode-commands';

/**
 * 匯出匯入命令類別
 * Export/Import Commands class
 *
 * 負責註冊和管理 VSCode 的匯出/匯入相關命令
 * Responsible for registering and managing VSCode export/import related commands
 *
 * 所有命令都透過此類別統一管理，並在建構時自動註冊
 * All commands are centrally managed through this class and automatically registered on construction
 */
export class ExportImportCommands
{
	/** 匯出匯入服務實例，處理實際的匯出/匯入邏輯 / Export/Import service instance handling actual export/import logic */
	private exportImportService: ExportImportService;

	constructor(context: vscode.ExtensionContext)
	{
		this.exportImportService = new ExportImportService(context);
		this.registerCommands(context);
	}

	/**
	 * 註冊所有命令
	 * Register all commands
	 *
	 * 將匯出/匯入相關的命令註冊到 VSCode，並加入上下文訂閱清單以便自動清理。
	 * Registers export/import related commands to VSCode and adds to context subscriptions for auto-cleanup.
	 *
	 * 使用箭頭函數保持 this 的指向，確保回呼能正確存取類別實例。
	 * Uses arrow functions to preserve 'this' context, ensuring callbacks can correctly access class instance.
	 */
	private registerCommands(context: vscode.ExtensionContext): void
	{
		/**
		 * 匯出自訂 IDE 命令
		 * Export custom IDEs command
		 * 允許使用者將自訂的 IDE 設定匯出為 JSON 檔案
		 * Allows users to export custom IDE settings to JSON file
		 */
		const exportCustomIDEsCommand = vscode.commands.registerCommand(
			EnumVscodeCommands.exportCustomIDEs,
			() => this.exportCustomIDEs(),
		);

		/**
		 * 匯出選擇的設定命令
		 * Export selected settings command
		 * 讓使用者選擇要匯出哪些設定項目
		 * Lets users choose which settings items to export
		 */
		const exportSelectedSettingsCommand = vscode.commands.registerCommand(
			EnumVscodeCommands.exportSelectedSettings,
			() => this.exportSelectedSettings(),
		);

		/**
		 * 匯出所有資料命令
		 * Export all data command
		 * 將所有 IDE 設定和自訂 IDE 一併匯出
		 * Exports all IDE settings and custom IDEs together
		 */
		const exportAllCommand = vscode.commands.registerCommand(
			EnumVscodeCommands.exportAll,
			() => this.exportAll(),
		);

		/**
		 * 匯入資料命令
		 * Import data command
		 * 從 JSON 檔案匯入設定和自訂 IDE
		 * Imports settings and custom IDEs from JSON file
		 */
		const importCommand = vscode.commands.registerCommand(
			EnumVscodeCommands.import,
			() => this.import(),
		);

		/**
		 * 將所有命令加入上下文訂閱清單
		 * Add all commands to context subscriptions
		 * 這樣在擴充套件停用時會自動釋放資源，避免記憶體洩漏
		 * This ensures resources are auto-released when extension deactivates, preventing memory leaks
		 */
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
	 *
	 * 將使用者自訂的 IDE 設定匯出為 JSON 檔案，包含路徑和配置資訊。
	 * Exports user-defined custom IDE settings to JSON file, including paths and configuration info.
	 *
	 * 檔案名稱包含日期，方便使用者識別匯出時間和版本。
	 * File name includes date for easy identification of export time and version.
	 */
	private async exportCustomIDEs(): Promise<void>
	{
		try
		{
			/**
			 * 呼叫服務層取得自訂 IDE 的匯出內容
			 * Call service layer to get export content for custom IDEs
			 * 服務層會處理實際的資料收集和格式化
			 * Service layer handles actual data collection and formatting
			 */
			const content = await this.exportImportService.exportCustomIDEs();
			/**
			 * 產生包含日期的檔案名稱，格式為 YYYY-MM-DD
			 * Generate file name with date in YYYY-MM-DD format
			 * 這樣使用者可以輕鬆識別不同時間點的匯出檔
			 * This allows users to easily identify exports from different time points
			 */
			const fileName = `custom-ides-export-${new Date().toISOString().split('T')[0]}.json`;
			await this.exportImportService.saveExportFile(content, fileName);
		}
		catch (error)
		{
			/**
			 * 錯誤處理：顯示友善的錯誤訊息給使用者
			 * Error handling: show user-friendly error message
			 * 使用 instanceof 檢查以確保能正確提取錯誤訊息
			 * Uses instanceof check to ensure correct error message extraction
			 */
			vscode.window.showErrorMessage(
				`匯出自訂 IDE 失敗: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * 匯出選擇的設定
	 * Export selected settings
	 *
	 * 讓使用者選擇要匯出的設定項目，只匯出被選中的項目。
	 * Lets users choose which settings items to export, only exporting selected items.
	 *
	 * 這種選擇性匯出可以避免匯出不必要的設定，減少檔案大小。
	 * Selective export avoids exporting unnecessary settings, reducing file size.
	 */
	private async exportSelectedSettings(): Promise<void>
	{
		try
		{
			/**
			 * 呼叫服務層取得選擇設定的匯出內容
			 * Call service layer to get export content for selected settings
			 * 使用者會透過 UI 對話框選擇要匯出的項目
			 * User selects items to export via UI dialog
			 */
			const content = await this.exportImportService.exportSelectedSettings();
			/**
			 * 產生包含日期的檔案名稱
			 * Generate file name with date
			 */
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
	 *
	 * 將所有 IDE 設定和自訂 IDE 一併匯出，適合完整備份。
	 * Exports all IDE settings and custom IDEs together, suitable for complete backup.
	 *
	 * 包含日期的檔案名稱讓使用者可以追蹤不同時間點的完整備份。
	 * Date-included file name lets users track complete backups at different time points.
	 */
	private async exportAll(): Promise<void>
	{
		try
		{
			/**
			 * 呼叫服務層取得所有資料的匯出內容
			 * Call service layer to get export content for all data
			 * 這會包含設定、自訂 IDE 等所有可同步的項目
			 * This includes settings, custom IDEs, and all synchronizable items
			 */
			const content = await this.exportImportService.exportAll();
			/**
			 * 產生包含日期的檔案名稱，使用 ide-sync-export 前綴
			 * Generate file name with date, using ide-sync-export prefix
			 * 方便使用者識別這是完整的同步匯出檔
			 * Helps users identify this as a complete sync export file
			 */
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
	 *
	 * 從 JSON 檔案匯入設定和自訂 IDE，包含解析、驗證、選項對話框和執行匯入。
	 * Imports settings and custom IDEs from JSON file, including parsing, validation, options dialog, and import execution.
	 *
	 * 使用非同步模式以支援檔案選擇對話框和可能的長時間操作。
	 * Uses async pattern to support file selection dialog and potentially long-running operations.
	 */
	private async import(): Promise<void>
	{
		try
		{
			/**
			 * 讀取使用者選擇的匯入檔案
			 * Read import file selected by user
			 * 服務層會開啟檔案選擇對話框讓使用者選擇 JSON 檔案
			 * Service layer opens file selection dialog for user to choose JSON file
			 */
			const content = await this.exportImportService.readImportFile();
			/**
			 * 使用者取消選擇檔案時，content 會是 null 或空字串
			 * When user cancels file selection, content will be null or empty string
			 * 此時應該直接返回，不顯示錯誤訊息
			 * Should return directly without showing error message
			 */
			if (!content)
			{
				return;
			}

			/**
			 * 解析並驗證匯入資料
			 * Parse and validate import data
			 * 使用 try-catch 來捕獲 JSON 解析錯誤，提供友善的錯誤提示
			 * Use try-catch to capture JSON parsing errors, provide user-friendly error prompts
			 */
			let data;
			try
			{
				data = JSON.parse(content);
			}
			catch (parseError)
			{
				/**
				 * JSON 格式無效時顯示錯誤訊息並返回
				 * Show error message and return when JSON format is invalid
				 * 不繼續執行匯入，因為資料無法解析
				 * Don't continue import because data cannot be parsed
				 */
				vscode.window.showErrorMessage('無效的 JSON 檔案格式');
				return;
			}

			/**
			 * 顯示匯入選項對話框
			 * Show import options dialog
			 * 讓使用者選擇要匯入哪些項目（設定、自訂 IDE 等）
			 * Lets user choose which items to import (settings, custom IDEs, etc.)
			 */
			const options = await this.exportImportService.showImportOptionsDialog(data);
			/**
			 * 使用者取消對話框時返回
			 * Return when user cancels dialog
			 * options 為 null 表示使用者按下了取消按鈕
			 * null options means user pressed cancel button
			 */
			if (!options)
			{
				return;
			}

			/**
			 * 執行匯入操作
			 * Perform import
			 * 傳入原始檔案內容和選項，服務層會處理實際的匯入邏輯
			 * Pass raw file content and options; service layer handles actual import logic
			 */
			const result = await this.exportImportService.importData(content, options);

			/**
			 * 顯示匯入結果
			 * Show import result
			 * 包含成功匯入的項目數量、跳過的項目和可能的警告
			 * Includes count of successfully imported items, skipped items, and possible warnings
			 */
			await this.showImportResult(result);
		}
		catch (error)
		{
			/**
			 * 捕獲未預期的錯誤並顯示給使用者
			 * Catch unexpected errors and display to user
			 * 使用 instanceof 檢查以確保能正確提取錯誤訊息
			 * Use instanceof check to ensure correct error message extraction
			 */
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
