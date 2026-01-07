import formatTitle from '@directus/format-title';
import { systemFieldRows } from '@directus/system-data';
import type { FieldMeta } from '@directus/types';
import { getAuthProviders } from './get-auth-providers.js';

// Dynamically populate auth providers field
export function getSystemFieldRowsWithAuthProviders(): FieldMeta[] {
	return systemFieldRows.map((systemField) => {
		if (systemField.collection === 'directus_users' && systemField.field === 'provider') {
			if (!systemField.options) systemField.options = {};

			systemField.options['choices'] = getAuthProviders().map(({ name }) => ({
				text: formatTitle(name),
				value: name,
			}));
		}

		return systemField;
	});
}
