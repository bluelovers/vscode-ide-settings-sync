/**
 * 內建備份 IDE 相關常數
 * Built-in backup IDE related constants
 *
 * 內建備份 IDE 是一個特殊的內建 IDE 項目，專供使用者利用同步功能
 * 將設定備份到自訂的資料夾路徑。它永遠存在於 IDE 列表中，且無法被移除。
 *
 * The built-in backup IDE is a special built-in IDE entry dedicated to
 * letting users back up their settings to a custom folder via the sync feature.
 * It always appears in the IDE list and cannot be removed.
 */

/**
 * 內建備份 IDE 的顯示名稱
 * Display name of the built-in backup IDE
 */
export const BACKUP_IDE_NAME = 'Backup';

/**
 * 尚未設定備份路徑時的提示訊息（雙語）
 * Hint message shown when the backup path has not been configured yet (bilingual)
 */
export const BACKUP_IDE_NOT_CONFIGURED_REASON = `[Backup IDE] 尚未設定備份路徑 / Backup path not configured. 請在上方輸入並套用備份路徑 / Please enter and apply a backup path above.`;