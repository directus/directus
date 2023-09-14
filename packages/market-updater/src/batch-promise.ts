export async function batchPromise<T, G>(items: T[], batchSize: number, callback: (item: T) => Promise<G>): Promise<G[]> {
	const results = [];

	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		const batchResults = await Promise.all(batch.map(callback));
		results.push(...batchResults);
	}

	return results;
}
