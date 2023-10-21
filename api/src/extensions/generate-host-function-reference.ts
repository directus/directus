export function generateHostFunctionReference(
	index: Generator<number, number, number>,
	args: string[],
	{ async }: { async: boolean }
): string {
	const argsList = args.join(', ');
	const i = index.next().value;

	if (async) {
		return `(${argsList}) => $${i}.apply(null, [${argsList}], { arguments: { reference: true }, result: { copy: true, promise: true } });`;
	} else {
		return `(${argsList}) => $${i}.applySync(null, [${argsList}], { arguments: { reference: true }, result: { copy: true } });`;
	}
}
