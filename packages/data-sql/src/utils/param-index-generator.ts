/**
 * Generator function to generate parameter indices.
 */
export function* parameterIndexGenerator(): Generator<number> {
	let index = 0;

	while (true) {
		yield index++;
	}
}
