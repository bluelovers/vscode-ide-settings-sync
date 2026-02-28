import { h } from 'preact';
import { IContentSecurityPolicyProps, ISettingsSyncPanelPagePropsRuntime } from './types';

export const ContentSecurityPolicy = (props: IContentSecurityPolicyProps) => {
	const cspSource = props.cspSource ?? props.panel?.webview.cspSource;

	const csp = [
		`default-src 'none'`,
		`img-src ${cspSource} https:`,
		`style-src ${cspSource} 'unsafe-inline'`,
		`script-src ${cspSource} 'unsafe-inline' 'unsafe-eval'`,
		`connect-src ${cspSource}`,
	].join('; ');

	return <meta http-equiv="Content-Security-Policy" content={csp} />;
};

export const PageHead = (props: ISettingsSyncPanelPagePropsRuntime) => {
	const self = props.settingsSyncPanel!;

	return (<head>
		<meta charset="UTF-8" />
		<ContentSecurityPolicy cspSource={self?.panel?.webview?.cspSource} />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>IDE Settings Sync</title>
		<style>
			{props.cssContent}
		</style>
	</head>);
};
