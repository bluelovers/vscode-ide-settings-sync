import { h, Fragment } from 'preact';

/**
 * 來源 IDE 顯示指示器
 */
export function SourceIdeIndicator({
	sourceIDEName,
	sourceIDEUuid,
}: {
	sourceIDEName: string;
	sourceIDEUuid: string;
}) {
		return (
				<div className="section source-ide-indicator">
						<span className="source-label">Source IDE:</span>
						<span className="source-name">
							{sourceIDEName || 'Not selected'}
							&nbsp;({sourceIDEUuid})
						</span>
				</div>
		);
}
