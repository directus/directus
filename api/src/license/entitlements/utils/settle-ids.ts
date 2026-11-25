export async function settleIds(ids: string[], fn: (id: string) => Promise<unknown>): Promise<string[]> {
	const results = await Promise.allSettled(ids.map((id) => fn(id)));

	return ids.filter((_id, index) => results[index]!.status === 'fulfilled');
}
