/** Coerce an env value to a number, or null when unset or non-numeric. */
export function numberOrNull(value: unknown): number | null {
	if (value === undefined || value === null || value === '') return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

/** Coerce an env value to a string, or null when unset. */
export function stringOrNull(value: unknown): string | null {
	if (value === undefined || value === null || value === '') return null;
	return String(value);
}
