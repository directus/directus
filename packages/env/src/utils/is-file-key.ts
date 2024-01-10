/**
 * If the current variable key points to a file that holds the value
 */
export const isFileKey = (key: string) => key.length > 5 && key.endsWith('_FILE');
