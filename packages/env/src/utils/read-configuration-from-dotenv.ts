import { readFileSync } from 'node:fs';
import { type DotenvParseOutput, parse } from 'dotenv';

/**
 * Matches a variable definition, capturing the key and the raw value
 */
const DEFINITION_REGEX = /^\s*(?:export\s+)?([\w.-]+)(?:\s*=|:)[ \t]*(.*)$/gm;

export function readConfigurationFromDotEnv(path: string): DotenvParseOutput {
	const contents = String(readFileSync(path));
	const output = parse(contents);

	// dotenv parses both `KEY=` and `KEY=""` to an empty string. Variables without a value are left out instead, so that
	// they are treated as not configured, while explicitly quoted empty strings are kept
	const isBare = new Map<string, boolean>();

	for (const [, key, rawValue] of contents.matchAll(DEFINITION_REGEX)) {
		isBare.set(key!, rawValue === '' || rawValue!.startsWith('#'));
	}

	for (const [key, bare] of isBare) {
		if (bare && output[key] === '') delete output[key];
	}

	return output;
}
