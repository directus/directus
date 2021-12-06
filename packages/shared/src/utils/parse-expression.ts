export function parseExpression(string: string): { func?: string; params?: string } {
	return string.match(/^(?<func>.+)\((?<params>.*?)$\)$/)?.groups ?? {};
}
