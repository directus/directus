export function mapValuesDeep(obj: Record<string, any>, fn: (key: string, value: any) => any): Record<string, any> {
	return recurse(obj);

	function recurse(obj: Record<string, any>, prefix = ''): Record<string, any> {
		if (Array.isArray(obj)) {
			return obj.map((value, index) => {
				if (typeof value === 'object' && value !== null) {
					return recurse(value, prefix + `[${index}]`);
				} else {
					return fn(prefix + `[${index}]`, value);
				}
			});
		} else {
			return Object.fromEntries(
				Object.entries(obj).map(([key, value]) => {
					if (typeof value === 'object' && value !== null) {
						return [key, recurse(value, prefix + (prefix ? '.' : '') + key)];
					} else {
						return [key, fn(prefix + (prefix ? '.' : '') + key, value)];
					}
				})
			);
		}
	}
}
