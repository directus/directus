export default function detectJsonIndent(json: string) {
	const lines = json.split(/\r?\n/);

	const braceLine = lines.findIndex((line) => /^(?:\{|\[)/.test(line));

	if (braceLine === -1 || braceLine + 1 > lines.length - 1) return null;

	const indent = lines[braceLine + 1]!.match(/[ \t]+/)?.[0];

	if (indent === undefined) return null;

	return indent;
}
