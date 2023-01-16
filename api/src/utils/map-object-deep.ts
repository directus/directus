export function mapObjectDeep(obj: Record<string, any>, fn: (key: string, value: any) => any): Record<string, any> {
	return recurse(obj);

	function recurse(obj: Record<string, any>, prefix = ''): Record<string, any> {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => {
				if (typeof value === 'object' && value !== null) {
					return [key, recurse(value, prefix + key + '.')];
				} else {
					return [key, fn(prefix + key, value)];
				}
			})
		);
	}
}
