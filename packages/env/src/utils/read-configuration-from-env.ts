import { readFileSync } from 'node:fs';

const LINE =
	/(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

export function readConfigurationFromDotEnv(path: string): Record<string, string> {
	const contents = String(readFileSync(path)).replace(/\r\n?/g, '\n');
	const output: Record<string, string> = {};

	for (const [, key, raw = ''] of contents.matchAll(LINE)) {
		const value = raw.trim();

		if (value === '') {
			delete output[key!];
			continue;
		}

		let parsed = value.replace(/^(['"`])([\s\S]*)\1$/gm, '$2');

		if (value[0] === '"') parsed = parsed.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

		output[key!] = parsed;
	}

	return output;
}
