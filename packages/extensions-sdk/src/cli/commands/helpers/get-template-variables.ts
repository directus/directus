export type TemplateVariables = Record<string, string>;

export default function getTemplateVariables(name: string): TemplateVariables {
	const baseName = name.substring(name.lastIndexOf('/') + 1).replace(/^directus-extension-/, '');

	const words = baseName
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((word) => word.length > 0);

	// Tiptap names and JS identifiers can not start with a digit
	if (!/^[a-z]/.test(words[0] ?? '')) words.unshift('custom');

	const capitalized = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
	const pascalName = capitalized.join('');

	return {
		__EXTENSION_ID__: words.join('-'),
		__EXTENSION_NAME__: capitalized.join(' '),
		__EXTENSION_CAMEL_NAME__: pascalName.charAt(0).toLowerCase() + pascalName.slice(1),
		__EXTENSION_PASCAL_NAME__: pascalName,
	};
}

export function fillTemplate(content: string, variables: TemplateVariables): string {
	return Object.entries(variables).reduce((result, [key, value]) => result.replaceAll(key, value), content);
}
