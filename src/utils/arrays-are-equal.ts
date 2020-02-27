/**
 * Compares two given arrays for equality. Only works for primitive values (no nested objects)
 * @param a1 First array
 * @param a2 Second array
 * @see https://stackoverflow.com/a/55614659/4859211
 */
export default function arraysAreEqual(
	a1: readonly (string | number)[],
	a2: readonly (string | number)[]
) {
	let superSet: {
		[key: string]: any;
		[key: number]: any;
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

	for (let e in superSet) {
		if (superSet[e] === 1) {
			return false;
		}
	}

	return true;
}
