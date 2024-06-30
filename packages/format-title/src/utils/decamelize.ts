export function decamelize(string: string): string {
	return string
		.replace(/([a-z\d])([A-Z])/g, '$1_$2')
		.replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1_$2')
		.toLowerCase();
}
