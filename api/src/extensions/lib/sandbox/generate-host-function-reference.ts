export function generateHostFunctionReference(
	index: Generator<number, number, number>,
	args: string[],
	{ async }: { async: boolean }
): string {
	const argsList = args.join(', ');
	const i = index.next().value;

	if (async) {
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
