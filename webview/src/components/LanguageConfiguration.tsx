/**
 * 語言設定區塊組件（SSR 組件）
 * Language configuration section component (SSR component)
 *
 * 渲染 primary language 下拉選單、fallback 語言標籤列表，
 * 以及條件性的 secondary language 顯示列。
 * Renders the primary language dropdown, fallback language tag list,
 * and a conditionally rendered secondary language row.
 *
 * 事件處理由 window 掛載的函數負責（onclick/onchange 字串）。
 * Event handling is done by window-mounted functions (onclick/onchange strings).
 */

import { ILanguageConfig } from '../types';

interface ILanguageSupportedItem
{
	/** 語言代碼（如 'en'、'zh-TW'）/ Language code (e.g., 'en', 'zh-TW') */
	code: string;
	/** 語言顯示名稱（如 'English'、'繁體中文'）/ Language display name (e.g., 'English', '繁體中文') */
	name: string;
}

interface ILanguageConfigProps
{
	/** 語言設定物件，包含 primary、fallbackList、secondary 等配置 / Language configuration object containing primary, fallbackList, secondary, etc. */
	languageConfig: ILanguageConfig;
	/** 支援的語言列表 / List of supported languages */
	supportedLanguages: ILanguageSupportedItem[];
	/** 當前選取的語言代碼 / Currently selected language code */
	currentLanguage: string;
}

/**
 * 渲染語言設定區塊的 UI
 * Render the language configuration section UI
 *
 * @param languageConfig - 語言設定物件 / Language configuration object
 * @param supportedLanguages - 支援的語言列表 / List of supported languages
 * @param currentLanguage - 當前語言代碼 / Current language code
 */
export function LanguageConfiguration({ languageConfig, supportedLanguages, currentLanguage }: ILanguageConfigProps)
{
	return (
		<div className="section">
			{/** 區塊標題 / Section title */}
			<h2>Description Language Configuration</h2>

			<div className="language-config">
				{/** 主要語言選擇列 / Primary language selection row */}
				<div className="config-row">
					<label htmlFor="primaryLang">Primary Language:</label>

					{/** 主要語言下拉選單 / Primary language dropdown */}
					{/* @ts-ignore */}
					<select id="primaryLang" onchange="changePrimaryLanguage && changePrimaryLanguage(this.value)">
						{supportedLanguages.map((lang) => (
							<option
								key={lang.code}
								value={lang.code}
								selected={lang.code === languageConfig.primary}
							>
								{lang.name}
							</option>
						))}
					</select>

					{/** 開啟語言詳細設定對話框 / Open language detailed configuration dialog */}
					{/* @ts-ignore */}
					<button className="btn btn-small" onclick="openLanguageConfig && openLanguageConfig()" title="Configure language settings">
						⚙ Config
					</button>
				</div>

				{/** Fallback 語言列表列 / Fallback languages list row */}
				<div className="config-row">
					<label>Fallback Languages:</label>
					<div className="fallback-list" id="fallbackList">
						{languageConfig.fallbackList.map((lang) =>
						{
							{/** 查找語言資訊，找不到則顯示代碼 / Find language info, show code if not found */}
							const langInfo = supportedLanguages.find((l) => l.code === lang);
							return (
								<span key={lang} className="fallback-tag">
									{langInfo?.name || lang}
								</span>
							);
						})}
					</div>
				</div>

				{/** 條件性渲染：當啟用 secondary language 時顯示 / Conditional render: show when secondary language is enabled */}
				{languageConfig.showSecondary && languageConfig.secondary
					? (
						<div className="config-row">
							<label>Secondary Language:</label>
							<span className="secondary-lang">
								{/** 顯示次要語言名稱，找不到則顯示代碼 / Display secondary language name, show code if not found */}
								{supportedLanguages.find((l) => l.code === languageConfig.secondary)?.name
									|| languageConfig.secondary}
							</span>
						</div>
					)
					: null}
			</div>
		</div>
	);
}
