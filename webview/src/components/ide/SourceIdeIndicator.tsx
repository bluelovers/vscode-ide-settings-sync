/**
 * 來源 IDE 指示器組件
 * Source IDE indicator component
 *
 * 顯示當前選取的同步來源 IDE 名稱與 UUID。
 * Displays the name and UUID of the currently selected sync source IDE.
 */

/**
 * 來源 IDE 指示器組件
 * Source IDE indicator component
 *
 * @param sourceIDEName - 來源 IDE 顯示名稱 / Source IDE display name
 * @param sourceIDEUuid - 來源 IDE UUID / Source IDE UUID
 */
export function SourceIdeIndicator({
	sourceIDEName,
	sourceIDEUuid,
}: {
	/** 來源 IDE 顯示名稱，未選取時顯示 'Not selected' / Source IDE display name; shows 'Not selected' when not selected */
	sourceIDEName: string;
	/** 來源 IDE UUID / Source IDE UUID */
	sourceIDEUuid: string;
})
{
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
