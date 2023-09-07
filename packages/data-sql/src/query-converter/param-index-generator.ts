/**
 * Generator function to generate parameter indices.
 */
export function* parameterIndexGenerator(): Generator<number, number, number> {
	let index = 0;

	while (true) {
		yield index++;
	}
}
