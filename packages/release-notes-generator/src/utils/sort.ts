export function sortByExternalOrder<T, O extends T[K][], K extends keyof T>(order: O, key: K): (a: T, b: T) => number {
	return (a, b) => {
		const indexOfA = order.indexOf(a[key]);
		const indexOfB = order.indexOf(b[key]);
		if (indexOfA >= 0 && indexOfB >= 0) return indexOfA - indexOfB;

		if (indexOfA >= 0) {
			return -1;
		}

		return 0;
	};
}

export function sortByObjectValues<T, O extends Record<any, T[K]>, K extends keyof T>(
	object: O,
	key: K
): (a: T, b: T) => number {
	const order = Object.values(object);
	return (a, b) => order.indexOf(a[key]) - order.indexOf(b[key]);
}
