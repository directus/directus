export function getRoutePrimaryKey(primaryKey: unknown): string | undefined {
	if (typeof primaryKey !== 'string' || primaryKey === '+') {
		return undefined;
	}

	return primaryKey;
}
