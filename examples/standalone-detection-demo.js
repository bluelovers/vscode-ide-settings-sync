/**
 * 獨立 IDE 偵測演示
 * Standalone IDE Detection Demo
 *
 * 此演示展示如何在 Node.js 環境中使用獨立的 IDE 偵測功能，
 * 不依賴 VSCode 擴展架構。
 *
 * This demo shows how to use standalone IDE detection functionality in Node.js environment,
 * without VSCode extension dependencies.
 */

const { createStandaloneIDEProvider, quickDetectIDEs } = require('../dist/providers/standaloneIDEProvider');
const { knownIDEs } = require('../dist/data/knownIDEs');

async function demonstrateStandaloneDetection() {
	console.log('🔍 獨立 IDE 偵測演示 / Standalone IDE Detection Demo\n');

	try {
		// 方法 1: 使用快速偵測函數
		// Method 1: Use quick detection function
		console.log('=== 方法 1: 快速偵測 / Method 1: Quick Detection ===');
		const quickResults = await quickDetectIDEs(knownIDEs, {
			verbose: true,
			logger: (msg) => console.log(`[QuickDetect] ${msg}`),
		});

		console.log(`偵測統計 / Detection Statistics:`);
		console.log(`- 總計 IDEs / Total IDEs: ${quickResults.statistics.total}`);
		console.log(`- 已偵測 / Detected: ${quickResults.statistics.detected}`);
		console.log(`- 未偵測 / Undetected: ${quickResults.statistics.undetected}`);
		console.log(`- 偵測率 / Detection Rate: ${(quickResults.statistics.detectionRate * 100).toFixed(1)}%\n`);

		// 顯示已偵測的 IDEs
		// Show detected IDEs
		if (quickResults.available.length > 0) {
			console.log('=== 已偵測到的 IDEs / Detected IDEs ===');
			quickResults.available.forEach((ide, index) => {
				console.log(`${index + 1}. ${ide.name}`);
				console.log(`   路徑 / Path: ${ide.nativePath}`);
				console.log(`   設定檔 / Settings: ${ide.settingsPath}`);
			});
			console.log();
		}

		// 顯示未偵測的 IDEs
		// Show undetected IDEs
		if (quickResults.unavailable.length > 0) {
			console.log('=== 未偵測到的 IDEs / Undetected IDEs ===');
			quickResults.unavailable.forEach((ide, index) => {
				console.log(`${index + 1}. ${ide.name}`);
				console.log(`   原因 / Reason: ${ide.reason?.split('\n')[0]}`);
			});
			console.log();
		}

		// 方法 2: 使用獨立 Provider
		// Method 2: Use standalone provider
		console.log('=== 方法 2: 獨立 Provider / Method 2: Standalone Provider ===');
		const provider = createStandaloneIDEProvider(knownIDEs, {
			verbose: true,
			logger: (msg) => console.log(`[Provider] ${msg}`),
		});

		await provider.refresh();

		// 檢查特定 IDE
		// Check specific IDE
		const windsurfResult = provider.getDetectionResult('Windsurf');
		console.log(`\n=== Windsurf 偵測結果 / Windsurf Detection Result ===`);
		if (windsurfResult) {
			console.log(`名稱 / Name: ${windsurfResult.name}`);
			console.log(`已偵測 / Detected: ${windsurfResult.detected}`);
			if (windsurfResult.detected) {
				console.log(`路徑 / Path: ${windsurfResult.path}`);
				console.log(`設定檔 / Settings: ${windsurfResult.settingsPath}`);
			} else {
				console.log(`原因 / Reason: ${windsurfResult.reason}`);
			}
		}

		// 匯出結果
		// Export results
		console.log('\n=== 匯出結果 / Export Results ===');
		const exported = provider.exportResults();
		console.log('已匯出 JSON 格式的偵測結果 / Exported detection results in JSON format:');
		console.log(exported);

		console.log('\n✅ 演示完成 / Demo completed successfully!');

	} catch (error) {
		console.error('❌ 演示失敗 / Demo failed:', error.message);
		console.error(error.stack);
		process.exit(1);
	}
}

// 如果直接運行此檔案，執行演示
// If this file is run directly, execute the demo
if (require.main === module) {
	demonstrateStandaloneDetection();
}

module.exports = { demonstrateStandaloneDetection };
