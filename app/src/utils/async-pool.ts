export async function asyncPool<IN, OUT>(
	poolLimit: number,
	array: ReadonlyArray<IN>,
	iteratorFn: (generator: IN, array: ReadonlyArray<IN>) => Promise<OUT>
): Promise<OUT[]> {
	const ret = [];
	const executing: any[] = [];

	for (const item of array) {
		const p = Promise.resolve().then(() => iteratorFn(item, array));
		ret.push(p);

		if (poolLimit <= array.length) {
			const e = p.then(() => executing.splice(executing.indexOf(e), 1));
			executing.push(e);
			if (executing.length >= poolLimit) {
				await Promise.race(executing);
			}
		}
	}
	return Promise.all(ret);
}
