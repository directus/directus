export async function processChunk<T = unknown>(
	arr: T[],
	size: number,
	callback: (chunk: T[]) => Promise<void>,
): Promise<void> {
	for (let i = 0; i < arr.length; i += size) {
		const chunk = arr.slice(i, i + size);
		await callback(chunk);
	}
}
