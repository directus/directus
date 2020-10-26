export function toArray(val: string): string[];
export function toArray(val: any | any[]): any[] {
	if (typeof val === 'string') {
		return val.split(',');
	}

	return Array.isArray(val) ? val : [val];
}
