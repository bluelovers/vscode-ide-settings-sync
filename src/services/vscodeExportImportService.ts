/**
 * VSCode 匯出匯入服務適配器
 * VSCode Export/Import Service Adapter
 *
 * 將核心匯出匯入功能適配到 VSCode 環境
 * Adapts core export/import functionality to VSCode environment
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ExportImportCore, IStorageProvider, IFileSystemProvider, IDialogProvider } from '../core/exportImportCore';
import { knownIDEs } from '../data/knownIDEs';

export class VSCodeStorageProvider implements IStorageProvider
{
	constructor(private context: vscode.ExtensionContext) {}

	get<T>(key: string, defaultValue?: T): T {
		return this.context.globalState.get(key, defaultValue as T);
	}

	async update(key: string, value: any): Promise<void> {
		await this.context.globalState.update(key, value);
	}
}

export class VSCodeFileSystemProvider implements IFileSystemProvider
{
	async readFile(path: string): Promise<string> {
		return fs.readFileSync(path, 'utf8');
	}

	async writeFile(path: string, content: string): Promise<void> {
		fs.writeFileSync(path, content, 'utf8');
	}
}

export class VSCodeDialogProvider implements IDialogProvider
{
	async showSaveDialog(options: any): Promise<string | undefined> {
		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', options.defaultName)),
			filters: options.filters,
		});

		return uri?.fsPath;
	}

	async showOpenDialog(options: any): Promise<string[] | undefined> {
		const uris = await vscode.window.showOpenDialog({
			canSelectMany: false,
			filters: options.filters,
		});

		return uris?.map(uri => uri.fsPath);
	}

	async showQuickPick(items: any[], options: any): Promise<any[] | undefined> {
		const selectedItems = await vscode.window.showQuickPick(items, {
			placeHolder: options.placeHolder,
			canPickMany: options.canPickMany,
			matchOnDescription: options.matchOnDescription,
			matchOnDetail: options.matchOnDetail,
		});

		if (!selectedItems) {
			return undefined;
		}

		// Handle single selection vs multi-selection
		if (options.canPickMany) {
			return Array.isArray(selectedItems) ? selectedItems : [selectedItems];
		}

		return [selectedItems];
	}

	async showMessage(message: string, type: 'info' | 'warning' | 'error'): Promise<void> {
		switch (type) {
			case 'info':
				await vscode.window.showInformationMessage(message);
				break;
			case 'warning':
				await vscode.window.showWarningMessage(message);
				break;
			case 'error':
				await vscode.window.showErrorMessage(message);
				break;
		}
	}
}

export class VSCodeExportImportService extends ExportImportCore
{
	constructor(context: vscode.ExtensionContext) {
		const storageProvider = new VSCodeStorageProvider(context);
		const fileSystemProvider = new VSCodeFileSystemProvider();
		const dialogProvider = new VSCodeDialogProvider();

		super(storageProvider, fileSystemProvider, dialogProvider);
	}

	/**
	 * 覆蓋匯出方法以包含已知 IDE 資訊
	 * Override export methods to include known IDEs information
	 */
	async exportCustomIDEs(): Promise<string> {
		const result = await super.exportCustomIDEs();
		const data = JSON.parse(result);
		
		// Add known IDEs information
		if (data.metadata) {
			data.metadata.knownIDEsExcluded = knownIDEs.map(ide => ide.name);
		}
		
		return JSON.stringify(data, null, 2);
	}

	async exportSelectedSettings(): Promise<string> {
		const result = await super.exportSelectedSettings();
		const data = JSON.parse(result);
		
		// Add known IDEs information
		if (data.metadata) {
			data.metadata.knownIDEsExcluded = knownIDEs.map(ide => ide.name);
		}
		
		return JSON.stringify(data, null, 2);
	}

	async exportAll(): Promise<string> {
		const result = await super.exportAll();
		const data = JSON.parse(result);
		
		// Add known IDEs information
		if (data.metadata) {
			data.metadata.knownIDEsExcluded = knownIDEs.map(ide => ide.name);
		}
		
		return JSON.stringify(data, null, 2);
	}
}
