/**
 * If the current variable key points to a file that holds the value
 */
export function isFileKey(key: string): boolean {
	return key.length > 5 && key.endsWith('_FILE');
}
