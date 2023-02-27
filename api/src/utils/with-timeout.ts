export const withTimeout = <T extends (...args: any[]) => Promise<unknown>>(
	prom: T,
	ms: number,
	err = new Error('Promise execution timed out')
) => {
	return ((...args) => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				reject(err);
			}, ms);

			prom(...args)
				.then(resolve)
				.catch(reject);
		});
	}) as T;
};
