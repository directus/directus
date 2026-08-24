import formatTitle from '@directus/format-title';
import { DeepPartial, Field } from '@directus/types';
import { translate } from '@/utils/translate-literal';

export function resolveFieldName(field: DeepPartial<Field>, locale: string): string {
	const translations = field.meta?.translations;

	if (Array.isArray(translations)) {
		const match = translations.find((entry) => entry?.language === locale && entry.translation);
		if (match?.translation) return match.translation;
	}

	if (typeof field.name === 'string' && field.name.startsWith('$t:')) {
		return translate(field.name);
	}

	return formatTitle(field.name ?? field.field!);
}
