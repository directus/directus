export function maybeStringifyBigInt(value: number | bigint): string | number {
	if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
		return String(value);
	}

	return Number(value);
}
