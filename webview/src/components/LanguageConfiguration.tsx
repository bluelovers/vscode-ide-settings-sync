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
	code: string;
	name: string;
}

interface ILanguageConfigProps
{
	languageConfig: ILanguageConfig;
	supportedLanguages: ILanguageSupportedItem[];
	currentLanguage: string;
}

export function LanguageConfiguration({ languageConfig, supportedLanguages, currentLanguage }: ILanguageConfigProps)
{
	return (
		<div className="section">
			<h2>Description Language Configuration</h2>
			<div className="language-config">
				<div className="config-row">
					<label htmlFor="primaryLang">Primary Language:</label>
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
					{/* @ts-ignore */}
					<button className="btn btn-small" onclick="openLanguageConfig && openLanguageConfig()" title="Configure language settings">
						⚙ Config
					</button>
				</div>

				<div className="config-row">
					<label>Fallback Languages:</label>
					<div className="fallback-list" id="fallbackList">
						{languageConfig.fallbackList.map((lang) =>
						{
							const langInfo = supportedLanguages.find((l) => l.code === lang);
							return (
								<span key={lang} className="fallback-tag">
									{langInfo?.name || lang}
								</span>
							);
						})}
					</div>
				</div>

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
