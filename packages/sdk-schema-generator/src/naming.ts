import type { NameTransformer } from "./types.js";


export function camelcase(str: string): string {
	return str.replace(
		/(?:^\w|[A-Z]|\b\w)/g,
		(word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()
	).replace(/\s+/g, '');
}

export function pascalcase(str: string): string {
	return str.replace(
		/(\w)(\w*)/g,
		(_, g1, g2) => g1.toUpperCase() + g2.toLowerCase()
	);
}

export function notransform(str: string): string {
	return str;
}

export const NamingFunctions: Record<string, NameTransformer> = {
	database: notransform,
	camelcase,
	pascalcase,
};
