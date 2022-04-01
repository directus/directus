export function isEmpty<Value>(value: Value | null | undefined): value is Value {
	return value == null || value === undefined;
}

export function notEmpty<Value>(value: Value | null | undefined): value is Value {
	return value !== null && value !== undefined;
}
