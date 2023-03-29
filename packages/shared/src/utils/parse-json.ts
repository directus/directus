/**
 * Run JSON.parse, but ignore `__proto__` properties. This prevents prototype pollution attacks
 */
export function parseJSON(input: string): any {
	if (String(input).includes('__proto__')) {
		return JSON.parse(input, noproto);
	}

	return JSON.parse(input);
}

export function noproto<T>(key: string, value: T): T | void {
	if (key !== '__proto__') {
		return value;
	}
}
