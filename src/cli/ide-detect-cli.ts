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
 * CLI Configuration Interface
 *
 * 定義命令行工具的配置選項，控制輸出格式和偵測行為
 * Defines command-line tool configuration options, controlling output format and detection behavior
 */
interface ICLIConfig
{
	/** 是否啟用詳細日誌輸出 / Whether to enable verbose logging output */
	verbose?: boolean;
	/** 輸出格式：表格、JSON 或摘要 / Output format: table, JSON, or summary */
	outputFormat?: 'table' | 'json' | 'summary';
	/** 自訂 IDE 清單，用於擴展偵測範圍 / Custom IDE list for extending detection scope */
	customIDEs?: Array<{ name: string; path: string }>;
}

/**
 * 解析命令行參數
 * Parse command line arguments
 *
 * 從 process.argv 讀取使用者提供的參數，並對應到 ICLIConfig 介面。
 * Reads user-provided arguments from process.argv and maps them to the ICLIConfig interface.
 *
 * 支援短參數（-v）和長參數（--verbose）兩種格式，提升使用者體驗。
 * Supports both short (-v) and long (--verbose) parameter formats to improve user experience.
 *
 * 自訂 IDE 參數格式為 --custom-ide=NAME:PATH，允許動態擴充偵測範圍。
 * Custom IDE parameter format is --custom-ide=NAME:PATH, allowing dynamic detection scope extension.
 */
function parseArgs(): ICLIConfig
{
	/**
	 * 跳過前兩個引數（node 執行檔路徑和腳本路徑），只處理使用者參數
	 * Skip first two arguments (node executable path and script path), only process user parameters
	 */
	const args = process.argv.slice(2);
	/**
	 * 預設輸出格式為表格，符合大多數使用者的閱讀習慣
	 * Default output format is table, matching most users' reading preferences
	 */
	const config: ICLIConfig = {
		outputFormat: 'table',
	};

	/**
	 * 逐一解析每個參數，使用 switch-case 提高可讀性和維護性
	 * Parse each argument sequentially, using switch-case for readability and maintainability
	 */
	for (let i = 0; i < args.length; i++)
	{
		const arg = args[i];

		switch (arg)
		{
			/**
			 * 詳細模式：輸出額外的偵測過程日誌
			 * Verbose mode: output additional detection process logs
			 * 有助於除錯和了解 IDE 偵測的詳細步驟
			 * Helps with debugging and understanding detailed IDE detection steps
			 */
			case '-v':
			case '--verbose':
				config.verbose = true;
				break;
			/**
			 * JSON 格式輸出：適合程式化處理和管道操作
			 * JSON format output: suitable for programmatic processing and piping
			 * 例如：node ide-detect-cli.js --json | jq '.availableIDEs'
			 * E.g., node ide-detect-cli.js --json | jq '.availableIDEs'
			 */
			case '-j':
			case '--json':
				config.outputFormat = 'json';
				break;
			/**
			 * 摘要模式：只顯示統計數據，不列出個別 IDE
			 * Summary mode: only show statistics, not individual IDEs
			 * 適合快速確認偵測成功率
			 * Suitable for quickly checking detection success rate
			 */
			case '-s':
			case '--summary':
				config.outputFormat = 'summary';
				break;
			/**
			 * 表格格式：人類可讀的表格輸出（預設）
			 * Table format: human-readable table output (default)
			 * 使用 console.table() 提供整齊的欄位對齊
			 * Uses console.table() for neatly aligned columns
			 */
			case '-t':
			case '--table':
				config.outputFormat = 'table';
				break;
			/**
			 * 顯示說明頁面後直接結束程式
			 * Display help page then exit program directly
			 * 這是標準 CLI 工具的行為模式
			 * This is standard CLI tool behavior pattern
			 */
			case '--help':
			case '-h':
				showHelp();
				process.exit(0);
				break;
			/**
			 * 自訂 IDE 參數處理
			 * Custom IDE parameter handling
			 * 格式：--custom-ide=NAME:PATH
			 * Format: --custom-ide=NAME:PATH
			 * 允許使用者指定不在 knownIDEs 清單中的 IDE
			 * Allows users to specify IDEs not in the knownIDEs list
			 */
			default:
				if (arg.startsWith('--custom-ide='))
				{
					/**
					 * 擷取 = 之後的內容，並用 : 分隔名稱和路徑
					 * Extract content after =, split name and path with :
					 * 這樣設計是為了讓 CLI 參數保持簡潔
					 * This design keeps CLI parameters concise
					 */
					const [name, path] = arg.substring(13).split(':');
					if (name && path)
					{
						/**
						 * 延遲初始化陣列，避免不必要的記憶體分配
						 * Lazy initialization of array to avoid unnecessary memory allocation
						 */
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
 *
 * 輸出完整的命令列使用說明，包含參數說明和範例。
 * Outputs complete command-line usage instructions, including parameter descriptions and examples.
 *
 * 使用模板字串（template literal）動態生成支援的 IDE 清單，避免手動維護。
 * Uses template literal to dynamically generate supported IDE list, avoiding manual maintenance.
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
 *
 * 使用 console.table() 提供整齊的欄位對齊，適合互動式查看。
 * Uses console.table() to provide neatly aligned columns, suitable for interactive viewing.
 *
 * 將可用的 IDE 和無法偵測的 IDE 分開顯示，方便使用者快速識別問題。
 * Separates available and undetectable IDEs for quick problem identification.
 */
function formatTableOutput(available: any[], unavailable: any[]): void
{
	console.log('\n=== Available IDEs ===');
	/**
	 * 沒有偵測到任何 IDE 時顯示提示訊息
	 * Show message when no IDEs detected
	 * 這可能是因為沒有安裝任何支援的 IDE，或是偵測邏輯有問題
	 * Could be because no supported IDEs installed, or detection logic issue
	 */
	if (available.length === 0)
	{
		console.log('No IDEs detected.');
	}
	else
	{
		/**
		 * 使用 console.table() 自動格式化為表格
		 * Use console.table() to auto-format as table
		 * 只顯示關鍵欄位（名稱、路徑、設定路徑），避免資訊過載
		 * Only show key fields (name, path, settings path) to avoid information overload
		 */
		console.table(available.map(ide => ({
			Name: ide.name,
			Path: ide.nativePath,
			Settings: ide.settingsPath,
		})));
	}

	console.log('\n=== Unavailable IDEs ===');
	if (unavailable.length === 0)
	{
		/**
		 * 所有 IDE 都成功偵測時顯示成功訊息
		 * Show success message when all IDEs detected
		 * 這是理想的狀態，表示所有已知 IDE 都已安裝
		 * This is the ideal state, indicating all known IDEs are installed
		 */
		console.log('All IDEs detected successfully.');
	}
	else
	{
		/**
		 * 顯示無法偵測的 IDE 及其原因
		 * Show undetectable IDEs and their reasons
		 * 只取第一行原因（reason），避免輸出過長的堆疊追蹤
		 * Only take first line of reason to avoid excessively long stack traces
		 */
		console.table(unavailable.map(ide => ({
			Name: ide.name,
			Reason: ide.reason?.split('\n')[0] || 'Unknown',
		})));
	}
}

/**
 * 格式化摘要輸出
 * Format summary output
 *
 * 只顯示統計數據，不包含個別 IDE 的詳細資訊。
 * Only show statistics, not individual IDE details.
 *
 * 適合快速確認檢測成功率，或是用於監控腳本。
 * Suitable for quickly checking detection success rate, or for monitoring scripts.
 */
function formatSummaryOutput(statistics: any): void
{
	console.log('\n=== Detection Summary ===');
	console.log(`Total IDEs: ${statistics.total}`);
	console.log(`Detected: ${statistics.detected}`);
	console.log(`Not detected: ${statistics.undetected}`);
	/**
	 * 將偵測率轉換為百分比，保留一位小數
	 * Convert detection rate to percentage, keeping one decimal place
	 * 這樣可以提供更精確的成功率回饋
	 * This provides more precise success rate feedback
	 */
	console.log(`Detection rate: ${(statistics.detectionRate * 100).toFixed(1)}%`);
}

/**
 * 格式化 JSON 輸出
 * Format JSON output
 *
 * 輸出結構化的 JSON 格式，包含時間戳記、統計和完整 IDE 清單。
 * Output structured JSON format with timestamp, statistics, and complete IDE list.
 *
 * 適合程式化處理，例如：node ide-detect-cli.js --json | jq '.availableIDEs'
 * Suitable for programmatic processing, e.g., node ide-detect-cli.js --json | jq '.availableIDEs'
 */
function formatJSONOutput(available: any[], unavailable: any[], statistics: any): void
{
	/**
	 * 建構包含時間戳記的完整輸出物件
	 * Build complete output object with timestamp
	 * 時間戳記有助於追蹤檢測時間，特別是在自動化腳本中
	 * Timestamp helps track detection time, especially in automation scripts
	 */
	const output = {
		timestamp: new Date().toISOString(),
		statistics,
		availableIDEs: available,
		unavailableIDEs: unavailable,
	};
	/**
	 * 使用 2 空格縮排，提高人類可讀性
	 * Use 2-space indentation for human readability
	 * JSON 格式方便後續的程式化處理和資料交換
	 * JSON format facilitates subsequent programmatic processing and data exchange
	 */
	console.log(JSON.stringify(output, null, 2));
}

/**
 * 主函數
 * Main function
 *
 * CLI 工具的進入點，協調參數解析、IDE 檢測和結果輸出。
 * CLI tool entry point, orchestrating parameter parsing, IDE detection, and result output.
 *
 * 使用非同步模式以支援可能的非同步檢測邏輯。
 * Uses async pattern to support potentially async detection logic.
 */
async function main(): Promise<void>
{
	try
	{
		/**
		 * 解析命令行參數，取得使用者指定的配置
		 * Parse command line arguments to get user-specified configuration
		 * 這些配置會影響檢測行為和輸出格式
		 * These configs affect detection behavior and output format
		 */
		const config = parseArgs();

		/**
		 * 建構檢測配置，將 CLI 參數對應到偵測器的配置介面
		 * Build detection config, mapping CLI params to detector's config interface
		 * verbose 模式時提供日誌函數，否則設為 undefined 以節省資源
		 * Provide logger function in verbose mode, otherwise undefined to save resources
		 */
		const detectionConfig: IDetectionConfig = {
			verbose: config.verbose,
			logger: config.verbose ? (message: string) => console.log(`[CLI] ${message}`) : undefined,
		};

		console.log('🔍 Starting IDE detection...\n');

		/**
		 * 執行 IDE 檢測，傳入已知 IDE 清單和自訂 IDE
		 * Execute IDE detection, passing known IDE list and custom IDEs
		 * 使用展開運算子 [...knownIDEs] 建立副本，避免修改原始資料
		 * Use spread operator [...knownIDEs] to create copy, avoiding mutation of original data
		 */
		const results = await quickDetectIDEs([...knownIDEs], {
			...detectionConfig,
			customIDEs: config.customIDEs,
		});

		/**
		 * 根據輸出格式選擇對應的格式化函數
		 * Select appropriate formatting function based on output format
		 * JSON 格式適合程式化處理；表格適合互動查看；摘要適合快速確認
		 * JSON for programmatic processing; table for interactive viewing; summary for quick checks
		 */
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

		/**
		 * 設定退出碼：偵測到 IDE 時回傳 0（成功），否則回傳 1（失敗）
		 * Set exit code: 0 (success) if IDEs detected, otherwise 1 (failure)
		 * 這對於 shell 腳本中的條件判斷非常有用
		 * This is very useful for conditional checks in shell scripts
		 */
		process.exit(results.statistics.detected > 0 ? 0 : 1);
	}
	catch (error)
	{
		console.error('❌ Error during IDE detection:', error);
		process.exit(1);
	}
}

/**
 * 如果直接運行此檔案，執行主函數
 * If this file is run directly, execute main function
 *
 * 檢查 require.main === module 來判斷是否為直接執行
 * Check require.main === module to determine if run directly
 * 這是 Node.js 判斷腳本是否為入口點的標準模式
 * This is the standard Node.js pattern for detecting if script is entry point
 */
if (require.main === module)
{
	main();
}

/**
 * 導出函數供其他模組使用
 * Export functions for use by other modules
 *
 * 允許其他模組（如測試）引入這些函數進行單元測試
 * Allows other modules (like tests) to import these functions for unit testing
 * 同時保留 CLI 直接執行的能力
 * While preserving CLI direct execution capability
 */
export { main, parseArgs, showHelp };
