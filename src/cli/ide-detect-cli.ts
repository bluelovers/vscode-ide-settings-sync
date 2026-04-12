#!/usr/bin/env node

/**
 * IDE 偵測 CLI 工具
 * IDE Detection CLI Tool
 *
 * 此工具演示如何在命令行環境中使用獨立的 IDE 偵測功能，
 * 不依賴 VSCode 擴展架構。
 *
 * This tool demonstrates how to use standalone IDE detection functionality in CLI environment,
 * without VSCode extension dependencies.
 */

import { knownIDEs } from '../data/knownIDEs';
import { createStandaloneIDEProvider, quickDetectIDEs } from '../providers/standaloneIDEProvider';
import { IDetectionConfig } from '../utils/ideDetector';

/**
 * CLI 配置介面
 */
interface ICLIConfig
{
	verbose?: boolean;
	outputFormat?: 'table' | 'json' | 'summary';
	customIDEs?: Array<{ name: string; path: string }>;
}

/**
 * 解析命令行參數
 * Parse command line arguments
 */
function parseArgs(): ICLIConfig
{
	const args = process.argv.slice(2);
	const config: ICLIConfig = {
		outputFormat: 'table',
	};

	for (let i = 0; i < args.length; i++)
	{
		const arg = args[i];

		switch (arg)
		{
			case '-v':
			case '--verbose':
				config.verbose = true;
				break;
			case '-j':
			case '--json':
				config.outputFormat = 'json';
				break;
			case '-s':
			case '--summary':
				config.outputFormat = 'summary';
				break;
			case '-t':
			case '--table':
				config.outputFormat = 'table';
				break;
			case '--help':
			case '-h':
				showHelp();
				process.exit(0);
				break;
			default:
				if (arg.startsWith('--custom-ide='))
				{
					const [name, path] = arg.substring(13).split(':');
					if (name && path)
					{
						if (!config.customIDEs)
						{
							config.customIDEs = [];
						}
						config.customIDEs.push({ name, path });
					}
				}
				break;
		}
	}

	return config;
}

/**
 * 顯示幫助資訊
 * Show help information
 */
function showHelp(): void
{
	console.log(`
IDE Detection CLI Tool

Usage:
  node ide-detect-cli.js [options]

Options:
  -v, --verbose          Enable verbose logging
  -j, --json             Output results in JSON format
  -s, --summary          Show summary only
  -t, --table            Show results in table format (default)
  --custom-ide=NAME:PATH Add custom IDE detection
  -h, --help             Show this help message

Examples:
  node ide-detect-cli.js                    # Basic detection in table format
  node ide-detect-cli.js --verbose          # Verbose output
  node ide-detect-cli.js --json             # JSON output
  node ide-detect-cli.js --summary          # Summary only
  node ide-detect-cli.js --custom-ide="MyIDE:/path/to/my/ide"  # Add custom IDE

Supported IDEs:
${knownIDEs.map(ide => `  - ${ide.name} (${ide.appFolderNames.join(', ')})`).join('\n')}
`);
}

/**
 * 格式化表格輸出
 * Format table output
 */
function formatTableOutput(available: any[], unavailable: any[]): void
{
	console.log('\n=== Available IDEs ===');
	if (available.length === 0)
	{
		console.log('No IDEs detected.');
	}
	else
	{
		console.table(available.map(ide => ({
			Name: ide.name,
			Path: ide.nativePath,
			Settings: ide.settingsPath,
		})));
	}

	console.log('\n=== Unavailable IDEs ===');
	if (unavailable.length === 0)
	{
		console.log('All IDEs detected successfully.');
	}
	else
	{
		console.table(unavailable.map(ide => ({
			Name: ide.name,
			Reason: ide.reason?.split('\n')[0] || 'Unknown',
		})));
	}
}

/**
 * 格式化摘要輸出
 * Format summary output
 */
function formatSummaryOutput(statistics: any): void
{
	console.log('\n=== Detection Summary ===');
	console.log(`Total IDEs: ${statistics.total}`);
	console.log(`Detected: ${statistics.detected}`);
	console.log(`Not detected: ${statistics.undetected}`);
	console.log(`Detection rate: ${(statistics.detectionRate * 100).toFixed(1)}%`);
}

/**
 * 格式化 JSON 輸出
 * Format JSON output
 */
function formatJSONOutput(available: any[], unavailable: any[], statistics: any): void
{
	const output = {
		timestamp: new Date().toISOString(),
		statistics,
		availableIDEs: available,
		unavailableIDEs: unavailable,
	};
	console.log(JSON.stringify(output, null, 2));
}

/**
 * 主函數
 * Main function
 */
async function main(): Promise<void>
{
	try
	{
		const config = parseArgs();

		const detectionConfig: IDetectionConfig = {
			verbose: config.verbose,
			logger: config.verbose ? (message: string) => console.log(`[CLI] ${message}`) : undefined,
		};

		console.log('🔍 Starting IDE detection...\n');

		const results = await quickDetectIDEs([...knownIDEs], {
			...detectionConfig,
			customIDEs: config.customIDEs,
		});

		switch (config.outputFormat)
		{
			case 'json':
				formatJSONOutput(results.available, results.unavailable, results.statistics);
				break;
			case 'summary':
				formatSummaryOutput(results.statistics);
				break;
			case 'table':
			default:
				formatTableOutput(results.available, results.unavailable);
				formatSummaryOutput(results.statistics);
				break;
		}

		// 設定退出碼
		// Set exit code
		process.exit(results.statistics.detected > 0 ? 0 : 1);
	}
	catch (error)
	{
		console.error('❌ Error during IDE detection:', error);
		process.exit(1);
	}
}

// 如果直接運行此檔案，執行主函數
// If this file is run directly, execute main function
if (require.main === module)
{
	main();
}

// 導出函數供其他模組使用
// Export functions for use by other modules
export { main, parseArgs, showHelp };
