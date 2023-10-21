export function wrap(util: any) {
	return async (...args: any[]) => {
		try {
			return { result: await util(...args), error: false };
		} catch (e) {
			return { result: e, error: true };
		}
	};
}
