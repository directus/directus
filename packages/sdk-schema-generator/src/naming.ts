import type { NameTransformer } from "./types.js";

function splitWords(str: string): string[] {
	return str
		.replace(/[-_]/g, ' ')
		.split(/(\s+|[A-Z][a-z0-9]+)/g)
		.filter(str => str.trim().length > 0)
		.map(str => str.toLocaleLowerCase());
}

function upperFirst(str: string): string {
	return str[0]?.toUpperCase() + str.slice(1);
}

export function camelcase(str: string): string {
	return splitWords(str)
		.map((word, index) => !index ? word : upperFirst(word))
		.join('');
}

export function pascalcase(str: string): string {
	return splitWords(str)
		.map((word) => upperFirst(word))
		.join('');
}

export function notransform(str: string): string {
	return str;
}

export const NamingFunctions: Record<string, NameTransformer> = {
	database: notransform,
	camelcase,
	pascalcase,
};

export function getNamingFn(name: string) {
	if (name in NamingFunctions) {
		return NamingFunctions[name]!;
	}

	return notransform;
}
