export function generateHostFunctionReference(
	index: Generator<number, number, number>,
	args: string[],
	{ async }: { async: boolean }
): string {
	const argsList = args.join(', ');
	const i = index.next().value;

	return `(${argsList}) => $${i}.apply(null, [${argsList}], { arguments: { reference: true }, result: { promise: ${
		async ? 'true' : 'false'
	} }});`;
}
