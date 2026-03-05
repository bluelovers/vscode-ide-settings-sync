/**
 * Custom IDE 整合測試
 * Custom IDE Integration Test
 *
 * 測試自訂 IDE 功能的完整整合
 * Test complete integration of custom IDE functionality
 */

import { IDEDetector, detectAllIDEs, detectCustomIDEs } from '../src/utils/ideDetector';
import { createStandaloneIDEProvider } from '../src/providers/standaloneIDEProvider';
import { knownIDEs } from '../src/data/knownIDEs';

function testCustomIDEIntegration() {
	console.log('🔧 測試 Custom IDE 整合功能 / Testing Custom IDE Integration\n');

	try {
		// 測試 1: 基本自訂 IDE 偵測
		// Test 1: Basic custom IDE detection
		console.log('=== 測試 1: 基本自訂 IDE 偵測 / Test 1: Basic Custom IDE Detection ===');
		
		const customIDEs = [
			{
				name: 'Test Custom IDE 1',
				path: 'C:\\Users\\Test\\AppData\\CustomIDE1',
			},
			{
				name: 'Test Custom IDE 2', 
				path: '/Users/test/.config/CustomIDE2',
			},
		];

		const detector = new IDEDetector({
			verbose: true,
			logger: (message) => console.log(`[Detector] ${message}`),
		});

		const customResults = detector.detectCustomIDEs(customIDEs);
		
		console.log(`\n自訂 IDE 偵測結果 / Custom IDE Detection Results:`);
		customResults.forEach((result, index) => {
			console.log(`${index + 1}. ${result.name}`);
			console.log(`   已偵測 / Detected: ${result.detected}`);
			console.log(`   嘗試路徑數 / Attempted Paths: ${result.attemptedPaths.length}`);
			if (!result.detected) {
				console.log(`   失敗原因 / Failure Reason: ${result.reason?.split('\n')[0]}`);
			}
		});

		// 測試 2: 整合偵測（已知 IDE + 自訂 IDE）
		// Test 2: Integrated detection (known IDEs + custom IDEs)
		console.log('\n=== 測試 2: 整合偵測 / Test 2: Integrated Detection ===');
		
		const allResults = detector.detectAllIDEs([...knownIDEs], customIDEs);
		
		console.log(`\n整合偵測統計 / Integrated Detection Statistics:`);
		console.log(`- 已知 IDEs / Known IDEs: ${allResults.knownResults.length}`);
		console.log(`- 自訂 IDEs / Custom IDEs: ${allResults.customResults.length}`);
		console.log(`- 總計 / Total: ${allResults.allResults.length}`);
		console.log(`- 已偵測 / Detected: ${allResults.allResults.filter(r => r.detected).length}`);

		// 測試 3: 使用便利函數
		// Test 3: Using convenience functions
		console.log('\n=== 測試 3: 便利函數 / Test 3: Convenience Functions ===');
		
		const convenienceResults = detectAllIDEs([...knownIDEs], customIDEs, {
			verbose: false,
		});
		
		console.log(`便利函數結果 / Convenience Function Results:`);
		console.log(`- 已知 IDEs 偵測 / Known IDEs Detected: ${convenienceResults.knownResults.filter(r => r.detected).length}/${convenienceResults.knownResults.length}`);
		console.log(`- 自訂 IDEs 偵測 / Custom IDEs Detected: ${convenienceResults.customResults.filter(r => r.detected).length}/${convenienceResults.customResults.length}`);

		// 測試 4: StandaloneProvider 與 CustomIDEs
		// Test 4: StandaloneProvider with CustomIDEs
		console.log('\n=== 測試 4: StandaloneProvider / Test 4: StandaloneProvider ===');
		
		const provider = createStandaloneIDEProvider([...knownIDEs], {
			verbose: true,
			logger: (message) => console.log(`[Provider] ${message}`),
			customIDEs: customIDEs,
		});

		// 模擬刷新
		// Simulate refresh
		provider.refresh().then(() => {
			const availableIDEs = provider.getAvailableIDEs();
			const unavailableIDEs = provider.getUnavailableIDEs();
			const statistics = provider.getStatistics();

			console.log(`\nProvider 統計 / Provider Statistics:`);
			console.log(`- 總計 / Total: ${statistics.total}`);
			console.log(`- 已偵測 / Detected: ${statistics.detected}`);
			console.log(`- 未偵測 / Undetected: ${statistics.undetected}`);
			console.log(`- 偵測率 / Detection Rate: ${(statistics.detectionRate * 100).toFixed(1)}%`);

			console.log(`\n可用的 IDEs / Available IDEs:`);
			availableIDEs.forEach((ide, index) => {
				console.log(`${index + 1}. ${ide.name} (${ide.available ? 'Available' : 'Unavailable'})`);
			});

			console.log(`\n不可用的 IDEs / Unavailable IDEs:`);
			unavailableIDEs.forEach((ide, index) => {
				console.log(`${index + 1}. ${ide.name}`);
				console.log(`   原因 / Reason: ${ide.reason?.split('\n')[0]}`);
			});

			// 測試 5: 匯出功能
			// Test 5: Export functionality
			console.log('\n=== 測試 5: 匯出功能 / Test 5: Export Functionality ===');
			
			const exported = provider.exportResults();
			const parsed = JSON.parse(exported);
			
			console.log(`匯出統計 / Export Statistics:`);
			console.log(`- 可用 IDEs 數量 / Available IDEs Count: ${parsed.availableIDEs.length}`);
			console.log(`- 不可用 IDEs 數量 / Unavailable IDEs Count: ${parsed.unavailableIDEs.length}`);
			console.log(`- 總結果數量 / Total Results Count: ${parsed.allResults.length}`);

			console.log('\n✅ Custom IDE 整合測試完成 / Custom IDE Integration Test Completed!');
		}).catch((error: unknown) => {
			console.error('❌ Provider 測試失敗 / Provider Test Failed:', error);
			throw error;
		});

		return true;

	} catch (error: unknown) {
		console.error('❌ 整合測試失敗 / Integration Test Failed:', error instanceof Error ? error.message : String(error));
		if (error instanceof Error && error.stack) {
			console.error(error.stack);
		}
		return false;
	}
}

// 如果直接運行此檔案，執行測試
// If this file is run directly, execute the test
if (require.main === module) {
	testCustomIDEIntegration();
}

module.exports = { testCustomIDEIntegration };
