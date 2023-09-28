import type { StringTransformer } from './types.js';

function splitWords(str: string): string[] {
	return str
		.replace(/[-_]/g, ' ')
		.split(/(\s+|[A-Z][a-z0-9]+)/g)
		.filter((str) => str.trim().length > 0)
		.map((str) => str.toLocaleLowerCase());
}

function upperFirst(str: string): string {
	return str[0]?.toUpperCase() + str.slice(1);
}

export function camelcase(str: string): string {
	return splitWords(str)
		.map((word, index) => (!index ? word : upperFirst(word)))
		.join('');
}

export function pascalcase(str: string): string {
	return splitWords(str)
		.map((word) => upperFirst(word))
		.join('');
}

/**
 * Retrieve a string transformer by name
 */
export function getNamingFn(str: string): StringTransformer {
	switch (str) {
		case 'camelcase':
			return camelcase;
		case 'pascalcase':
			return pascalcase;
		case 'database':
		default:
			return (str: string) => str;
	}
}
