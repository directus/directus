import slugify from '@sindresorhus/slugify';

export function normalizeSlugValue(value: string, separator = '-'): string {
	const endsWithSpace = value.endsWith(' ');
	let normalizedValue = slugify(value, { separator, preserveTrailingDash: true });

	if (endsWithSpace) {
		normalizedValue += separator;
	}

	return normalizedValue;
}

export function normalizeDbSafeValue(value: string): string {
	return value
		.replace(/\s/g, '_')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9_]/g, '');
}
