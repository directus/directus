/**
 * Generator function to generate parameter indices.
 */
export function* numberGenerator(): Generator<number, number, number> {
	let index = 0;

	while (true) {
		yield index++;
	}
}
