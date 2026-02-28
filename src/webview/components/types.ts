import { ITSRequireAtLeastOne } from 'ts-type';
import { WebviewPanel } from 'vscode';
import { SettingsSyncPanel } from '../settingsSyncPanel';



export type IContentSecurityPolicyProps = ITSRequireAtLeastOne<{
	panel: WebviewPanel;
	cspSource: string;
}>;

export interface ISettingsSyncPanelPageProps {
	settingsSyncPanel: SettingsSyncPanel;
	cssContent: string;
}

export type ISettingsSyncPanelPagePropsRuntime = Partial<ISettingsSyncPanelPageProps>;
