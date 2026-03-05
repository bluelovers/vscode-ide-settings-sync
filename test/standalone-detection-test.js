/**
 * 獨立 IDE 偵測測試
 * Standalone IDE Detection Test
 *
 * 直接測試 TypeScript始始碼中的獨立偵測功能
 * Test standalone detection functionality directly from TypeScript source
 */

// 直接從源碼導入模組
// Import modules directly from source
const { IDEDetector } = require('../src/utils/ideDetector');
const { knownIDEs } = require('../src/data/knownIDEs');

function testStandaloneDetection() {
	console.log('🔍 測試獨立 IDE 偵測功能 / Testing Standalone IDE Detection\n');

	try {
		// 創建偵測器實例
		// Create detector instance
		const detector = new IDEDetector({
			verbose: true,
			logger: (message) => console.log(`[Detector] ${message}`),
		});

		console.log('=== 偵測所有已知 IDEs / Detect All Known IDEs ===');
		
		// 偵測所有 IDE
		// Detect all IDEs
		const results = detector.detectIDEs([...knownIDEs]);
		
		console.log(`\n偵測結果統計 / Detection Results Statistics:`);
		console.log(`- 總計 IDEs / Total IDEs: ${results.length}`);
		console.log(`- 已偵測 / Detected: ${results.filter(r => r.detected).length}`);
		console.log(`- 未偵測 / Undetected: ${results.filter(r => !r.detected).length}`);

		// 顯示詳細結果
		// Show detailed results
		console.log('\n=== 詳細偵測結果 / Detailed Detection Results ===');
		results.forEach((result, index) => {
			console.log(`\n${index + 1}. ${result.name}`);
			console.log(`   已偵測 / Detected: ${result.detected}`);
			if (result.detected) {
				console.log(`   路徑 / Path: ${result.path}`);
				console.log(`   設定檔 / Settings: ${result.settingsPath}`);
			} else {
				console.log(`   原因 / Reason: ${result.reason?.split('\n')[0]}`);
			}
			console.log(`   嘗試路徑數 / Attempted Paths: ${result.attemptedPaths.length}`);
		});

		// 特別測試 Windsurf
		// Test Windsurf specifically
		console.log('\n=== Windsurf 專項測試 / Windsurf Specific Test ===');
		const windsurfIDE = knownIDEs.find(ide => ide.name === 'Windsurf');
		if (windsurfIDE) {
			const windsurfResult = detector.detectIDE(windsurfIDE);
			console.log(`Windsurf 偵測結果 / Windsurf Detection Result:`);
			console.log(`- 已偵測 / Detected: ${windsurfResult.detected}`);
			if (windsurfResult.detected) {
				console.log(`- 路徑 / Path: ${windsurfResult.path}`);
				console.log(`- 設定檔 / Settings: ${windsurfResult.settingsPath}`);
			} else {
				console.log(`- 嘗試的路徑 / Attempted Paths:`);
				windsurfResult.attemptedPaths.forEach(path => {
					console.log(`  * ${path}`);
				});
				console.log(`- 失敗原因 / Failure Reason: ${windsurfResult.reason}`);
			}
		}

		console.log('\n✅ 獨立偵測測試完成 / Standalone Detection Test Completed!');
		return true;

	} catch (error) {
		console.error('❌ 測試失敗 / Test Failed:', error.message);
		console.error(error.stack);
		return false;
	}
}

// 運行測試
// Run test
if (require.main === module) {
	const success = testStandaloneDetection();
	process.exit(success ? 0 : 1);
}

module.exports = { testStandaloneDetection };
