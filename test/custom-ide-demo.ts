/**
 * Custom IDE 演示
 * Custom IDE Demo
 *
 * 使用 tsx/ts-node 直接執行的簡化演示
 * Simplified demo for direct execution with tsx/ts-node
 */

import { IDEDetector, detectAllIDEs, detectCustomIDEs } from '../src/utils/ideDetector';
import { createStandaloneIDEProvider } from '../src/providers/standaloneIDEProvider';
import { knownIDEs } from '../src/data/knownIDEs';

async function demonstrateCustomIDEs()
{
	console.log('🔧 Custom IDE 功能演示 / Custom IDE Functionality Demo\n');

	try
	{
		// 創建偵測器
		// Create detector
		const detector = new IDEDetector({
			verbose: true,
			logger: (message: string) => console.log(`[Detector] ${message}`),
		});

		// 定義一些測試用的自訂 IDE
		// Define some test custom IDEs
		const testCustomIDEs = [
			{
				name: 'My Custom IDE 1',
				path: 'C:\\Program Files\\MyCustomIDE1',
			},
			{
				name: 'My Custom IDE 2',
				path: '/Users/myuser/.config/MyCustomIDE2',
			},
			{
				name: 'Test IDE (Non-existent)',
				path: '/non/existent/path/test-ide',
			},
		];

		console.log('=== 1. 偵測自訂 IDEs / Detecting Custom IDEs ===');
		const customResults = detector.detectCustomIDEs(testCustomIDEs);

		console.log(`\n自訂 IDE 偵測結果 / Custom IDE Detection Results:`);
		customResults.forEach((result, index) =>
		{
			console.log(`${index + 1}. ${result.name}`);
			console.log(`   已偵測 / Detected: ${result.detected}`);
			if (result.detected)
			{
				console.log(`   路徑 / Path: ${result.path}`);
				console.log(`   設定檔 / Settings: ${result.settingsPath}`);
			}
			else
			{
				console.log(`   失敗原因 / Reason: ${result.reason?.split('\n')[0]}`);
			}
		});

		console.log('\n=== 2. 整合偵測（已知 + 自訂）/ Integrated Detection (Known + Custom) ===');
		const allResults = detector.detectAllIDEs([...knownIDEs], testCustomIDEs);

		console.log(`\n整合統計 / Integrated Statistics:`);
		console.log(`- 已知 IDEs / Known IDEs: ${allResults.knownResults.length}`);
		console.log(`- 自訂 IDEs / Custom IDEs: ${allResults.customResults.length}`);
		console.log(`- 總計 / Total: ${allResults.allResults.length}`);
		console.log(`- 已偵測 / Detected: ${allResults.allResults.filter(r => r.detected).length}`);

		console.log('\n=== 3. 使用 StandaloneProvider / Using StandaloneProvider ===');
		const provider = createStandaloneIDEProvider([...knownIDEs], {
			verbose: true,
			logger: (message: string) => console.log(`[Provider] ${message}`),
			customIDEs: testCustomIDEs,
		});

		await provider.refresh();

		const availableIDEs = provider.getAvailableIDEs();
		const unavailableIDEs = provider.getUnavailableIDEs();
		const statistics = provider.getStatistics();

		console.log(`\nProvider 統計 / Provider Statistics:`);
		console.log(`- 總計 / Total: ${statistics.total}`);
		console.log(`- 已偵測 / Detected: ${statistics.detected}`);
		console.log(`- 未偵測 / Undetected: ${statistics.undetected}`);
		console.log(`- 偵測率 / Detection Rate: ${(statistics.detectionRate * 100).toFixed(1)}%`);

		console.log(`\n可用的 IDEs / Available IDEs:`);
		availableIDEs.forEach((ide, index) =>
		{
			console.log(`${index + 1}. ${ide.name} (${ide.available ? '✅' : '❌'})`);
		});

		console.log(`\n不可用的 IDEs / Unavailable IDEs:`);
		unavailableIDEs.forEach((ide, index) =>
		{
			console.log(`${index + 1}. ${ide.name} - ${ide.reason?.split('\n')[0]}`);
		});

		console.log('\n=== 4. 匯出結果 / Export Results ===');
		const exported = provider.exportResults();
		const parsed = JSON.parse(exported);

		console.log(`匯出摘要 / Export Summary:`);
		console.log(`- 時間戳 / Timestamp: ${parsed.timestamp}`);
		console.log(`- 可用 IDEs / Available IDEs: ${parsed.availableIDEs.length}`);
		console.log(`- 不可用 IDEs / Unavailable IDEs: ${parsed.unavailableIDEs.length}`);
		console.log(`- 總結果 / Total Results: ${parsed.allResults.length}`);

		console.log('\n✅ Custom IDE 演示完成 / Custom IDE Demo Completed!');
		return true;

	}
	catch (error: unknown)
	{
		console.error('❌ 演示失敗 / Demo Failed:', error instanceof Error ? error.message : String(error));
		if (error instanceof Error && error.stack)
		{
			console.error(error.stack);
		}
		return false;
	}
}

// 直接運行演示
// Run demo directly
demonstrateCustomIDEs().then((success) =>
{
	process.exit(success ? 0 : 1);
}).catch((error: unknown) =>
{
	console.error('❌ 未捕獲的錯誤 / Uncaught Error:', error);
	process.exit(1);
});
