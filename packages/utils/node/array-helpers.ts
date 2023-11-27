export function isIn<T extends readonly string[]>(value: string, array: T): value is T[number] {
	return array.includes(value);
}

export function isTypeIn<T extends { type?: string }, E extends string>(
	object: T,
	array: readonly E[],
): object is Extract<T, { type?: E }> {
	if (!object.type) return false;

	return (array as readonly string[]).includes(object.type);
}
