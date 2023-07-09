/**
 * Generator function to generate parameter indices.
 */
export function* parameterIndexGenerator(): Generator<number, never, never> {
	let index = 0;

	while (true) {
		yield index++;
	}
}
