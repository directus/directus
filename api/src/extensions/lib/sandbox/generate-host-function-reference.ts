/**
 * Generate an anonymous function wrapper with the provided arguments that applies the args against a referenced function in the host
 *
 * @param index - Generator function that tracks the indexes used
 * @param args - Named arguments of the host function
 * @param options - Options to modify the output function
 * @param options.async - Whether or not to generate the wrapper function as an async function
 */
export function generateHostFunctionReference(
	index: Generator<number, number, number>,
	args: string[],
	options: { async: boolean }
): string {
	const argsList = args.join(', ');
	const i = index.next().value;

	if (options.async) {
		return `
			async (${argsList}) => {
				const { result, error } = await $${i}.apply(undefined, [${argsList}], { arguments: { reference: true }, result: { copy: true, promise: true } });

				if (error) {
					throw result;
				} else {
					return result;
				}
			};
		`;
	} else {
		return `(${argsList}) => $${i}.applySync(undefined, [${argsList}], { arguments: { reference: true }, result: { copy: true } });`;
	}
}
