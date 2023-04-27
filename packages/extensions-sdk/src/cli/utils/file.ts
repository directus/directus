export function getFileExt(path: string): string {
	return path.substring(path.lastIndexOf('.') + 1);
}
