export type NumberGenerator = Generator<number, never, never>;

/**
 * Generator function to generate parameter indices.
 */
export function* numberGenerator(): NumberGenerator {
	let index = 0;

	while (true) {
		yield index++;
	}
}
