export default function toObject(val: string): Record<string, string> | null {
	const arr = val.split(',');

	const obj: Record<string, string> = {};
	for (const v of arr) {
		const sub = v.match(/^([^:]+):(.+)$/);

		if (sub) {
			obj[sub[1]!] = sub[2]!;
		} else {
			return null;
		}
	}

	return obj;
}
