/**
 * Extract the files of a drop event, discarding dropped directories.
 *
 * Must be called synchronously within the drop handler, as the data transfer items are cleared once
 * the event has been handled.
 */
export function getDroppedFiles(dataTransfer: DataTransfer): File[] {
	const items = Array.from(dataTransfer.items ?? []).filter((item) => item.kind === 'file');

	if (items.length === 0) return Array.from(dataTransfer.files);

	const files: File[] = [];

	for (const item of items) {
		// A directory yields a `File` with an empty type, which is indistinguishable from a file with
		// an extension the browser has no mime type for
		if (item.webkitGetAsEntry?.()?.isDirectory) continue;

		const file = item.getAsFile();

		if (file) files.push(file);
	}

	return files;
}
