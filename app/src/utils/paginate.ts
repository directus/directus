export function pages(array: any[], size: number) {
	return Math.ceil(array.length / size);
}

export function getPage<T>(array: T[], size: number, page: number) {
	return array.slice(page * size, (page + 1) * size);
}

export async function batchPromises<T>(array: T[], pageSize: number, forEach: (item: T) => Promise<any>) {
	const results: PromiseSettledResult<any>[] = [];
	for (let i = 0; i < pages(array, pageSize); i++) {
		const page = getPage(array, pageSize, i).map(forEach);
		const pageSettled = await Promise.allSettled(page);
		results.concat(pageSettled);
	}
	return results;
}
