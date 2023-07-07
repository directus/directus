import formatTitle from '@directus/format-title';
import type { FieldMeta } from '@directus/types';
import fse from 'fs-extra';
import { merge } from 'lodash-es';
import path from 'node:path';
import { CONTEXT_ROOT } from '../../../constants.js';
import { getAuthProviders } from '../../../utils/get-auth-providers.js';
import { requireYAML } from '../../../utils/require-yaml.js';

const fieldsPath = path.join(CONTEXT_ROOT, 'database', 'system-data', 'fields');

const defaults = requireYAML(path.join(fieldsPath, './_defaults.yaml'));
const fieldsFiles = fse.readdirSync(fieldsPath);

export const systemFieldRows: FieldMeta[] = [];

for (const file of fieldsFiles) {
	if (file.includes('_defaults') || file.includes('index')) continue;

	const systemFields = requireYAML(path.join(fieldsPath, file));

	(systemFields['fields'] as FieldMeta[]).forEach((field, index) => {
		const systemField = merge({ system: true }, defaults, field, {
			collection: systemFields['table'],
			sort: index + 1,
		});

		// Dynamically populate auth providers field
		if (systemField.collection === 'directus_users' && systemField.field === 'provider') {
			getAuthProviders().forEach(({ name }) => {
				systemField.options?.['choices']?.push({
					text: formatTitle(name),
					value: name,
				});
			});
		}

		systemFieldRows.push(systemField);
	});
}
