import type { FieldMeta } from '@directus/types';
import fse from 'fs-extra';
import { merge } from 'lodash-es';
import path from 'path';
import { getAuthProviders } from '../../../utils/get-auth-providers.js';
import { requireYAML } from '../../../utils/require-yaml.js';
import formatTitle from '@directus/format-title';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaults = requireYAML(path.join(__dirname, './_defaults.yaml'));
const fieldData = fse.readdirSync(path.resolve(__dirname));

export const systemFieldRows: FieldMeta[] = [];

for (const filepath of fieldData) {
	if (filepath.includes('_defaults') || filepath.includes('index')) continue;

	const systemFields = requireYAML(path.resolve(__dirname, filepath));

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
