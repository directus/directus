import formatTitle from '@directus/format-title';
import type { Collection } from '@directus/types';
import { i18n } from '@/lang';

export function getCollectionName(collection: Collection): string {
	const t = i18n.global.t;
	const te = i18n.global.te;

	const singularKey = `collection_names_singular.${collection.collection}`;
	const pluralKey = `collection_names_plural.${collection.collection}`;

	if (te(singularKey)) {
		return t(singularKey);
	}

	if (te(pluralKey)) {
		return t(pluralKey);
	}

	return (collection.meta as any)?.translations?.[0]?.translation ?? formatTitle(collection.collection);
}
