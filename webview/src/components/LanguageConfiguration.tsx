import { ILanguageConfig } from '../types';

/** ─── 型別定義 / Type definitions ─── */

/**
 * 單一支援語言的代碼與顯示名稱
 * Code and display name of a single supported language
 */
interface ILanguageSupportedItem
{
	/** 語言代碼（如 'en'、'zh-tw'）/ Language code (e.g. 'en', 'zh-tw') */
	code: string;
	/** 語言顯示名稱（如 'English'、'繁體中文'）/ Language display name (e.g. 'English', '繁體中文') */
	name: string;
}

/**
 * LanguageConfiguration 組件的 Props 介面
 * Props interface for the LanguageConfiguration component
 */
interface ILanguageConfigProps
{
	/** 當前語言配置（主語言、Fallback 列表、副語言等）/ Current language configuration (primary, fallback list, secondary, etc.) */
	languageConfig: ILanguageConfig;
	/** 所有支援的語言列表，用於渲染下拉選單選項 / List of all supported languages, used to render dropdown options */
	supportedLanguages: ILanguageSupportedItem[];
	/** 當前生效的語言代碼 / Currently active language code */
	currentLanguage: string;
}

/** ─── 組件 / Component ─── */

/**
 * 語言設定區塊組件
 * Language configuration section component
 *
 * 渲染 primary language 下拉選單、fallback 語言標籤列表，
 * 以及條件性的 secondary language 顯示列。
 * Renders the primary language dropdown, fallback language tag list,
 * and a conditionally rendered secondary language row.
 *
 * 此組件用於 SSR（Server-Side Rendering），`onchange`/`onclick` 使用
 * 小寫字串屬性以確保 preact-render-to-string 輸出正確的 HTML 屬性，
 * 實際事件處理由 Webview bundle 中的 `language.ts` 負責。
 * This component is used for SSR. `onchange`/`onclick` use lowercase string
 * attributes to ensure preact-render-to-string outputs correct HTML attributes.
 * Actual event handling is handled by `language.ts` in the Webview bundle.
 */
export function LanguageConfiguration({ languageConfig, supportedLanguages, currentLanguage }: ILanguageConfigProps)
{
	return (
		<div className="section">
			<h2>Description Language Configuration</h2>
			<div className="language-config">
				{/* Primary Language 下拉選單列 / Primary language dropdown row */}
				<div className="config-row">
					<label htmlFor="primaryLang">Primary Language:</label>
					{/**
					 * onchange 使用小寫字串屬性以相容 SSR 輸出
					 * onchange uses lowercase string attribute for SSR output compatibility
					 */}
					{/* @ts-ignore */}
					<select id="primaryLang" onchange="changePrimaryLanguage()">
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
					{/* @ts-ignore */}
					<button className="btn btn-small" onclick="openLanguageConfig()" title="Configure language settings">
						⚙ Config
					</button>
				</div>

				{/* Fallback Languages 標籤列 / Fallback languages tag row */}
				<div className="config-row">
					<label>Fallback Languages:</label>
					<div className="fallback-list" id="fallbackList">
						{languageConfig.fallbackList.map((lang) =>
						{
							/**
							 * 查找語言代碼對應的顯示名稱，找不到時直接顯示代碼
							 * Look up the display name for the language code; fall back to the code itself if not found
							 */
							const langInfo = supportedLanguages.find((l) => l.code === lang);
							return (
								<span key={lang} className="fallback-tag">
									{langInfo?.name || lang}
								</span>
							);
						})}
					</div>
				</div>

				{/**
				 * Secondary Language 列（條件性渲染）
				 * Secondary language row (conditionally rendered)
				 *
				 * 僅在 showSecondary 為 true 且 secondary 有值時才渲染，
				 * 避免在未設定副語言時顯示空白列。
				 * Only rendered when showSecondary is true and secondary has a value,
				 * to avoid showing an empty row when no secondary language is configured.
				 */}
				{languageConfig.showSecondary && languageConfig.secondary
					? (
						<div className="config-row">
							<label>Secondary Language:</label>
							<span className="secondary-lang">
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
