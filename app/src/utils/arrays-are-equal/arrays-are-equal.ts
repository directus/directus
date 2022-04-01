export default function arraysAreEqual(a1: readonly (string | number)[], a2: readonly (string | number)[]): boolean {
	const superSet: {
		[key: string]: number;
	} = {};

	for (let i = 0; i < a1.length; i++) {
		const e = a1[i] + typeof a1[i];
		superSet[e] = 1;
	}

	for (let i = 0; i < a2.length; i++) {
		const e = a2[i] + typeof a2[i];
		if (!superSet[e]) {
			return false;
		}
		superSet[e] = 2;
	}

	for (const e in superSet) {
		if (superSet[e] === 1) {
			return false;
		}
	}

	return true;
}
