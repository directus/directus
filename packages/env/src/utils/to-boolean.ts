/**
 * Parse a boolean env value. Accepts `true`/`false`/`1`/`0` case-insensitively. Returns `undefined` for anything else
 */
export function toBoolean(value: unknown): boolean | undefined {
	if (typeof value === 'boolean') return value;
	if (value === 1) return true;
	if (value === 0) return false;
	if (typeof value !== 'string') return undefined;

	const normalized = value.trim().toLowerCase();

	if (normalized === 'true' || normalized === '1') return true;
	if (normalized === 'false' || normalized === '0') return false;

	return undefined;
}
