import { h, Fragment } from 'preact';
import { PathInput } from './PathInput';
import { ActionBtn } from './ActionBtn';

interface IImportSectionProps {
	actionOnClick: string;
	actionTitle: string;
	actionText: string;
	isProcessing?: boolean;
}

export function ImportSection({ 
	actionOnClick, 
	actionTitle, 
	actionText,
	isProcessing = false 
}: IImportSectionProps) {
	return (
		<div class="import-section">
			<h3>📥 Import Settings</h3>
			
			<div class="path-selection">
				<h4>Import File</h4>
				<PathInput 
					id="importPath" 
					placeholder="Enter file path or leave empty to use file dialog"
					onBrowse="handleBrowseImportPath()"
				/>
			</div>

			<div class="actions">
				<ActionBtn 
					onClick={actionOnClick}
					title={actionTitle}
					processing={isProcessing}
				>
					{actionText}
				</ActionBtn>
			</div>
		</div>
	);
}
