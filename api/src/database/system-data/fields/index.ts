import fse from 'fs-extra';
import { merge } from 'lodash';
import path from 'path';
import { FieldMeta } from '../../../types';
import { requireYAML } from '../../../utils/require-yaml';

const defaults = requireYAML(require.resolve('./_defaults.yaml'));
const fieldData = fse.readdirSync(path.resolve(__dirname));

export const systemFieldRows: FieldMeta[] = [];

for (const filepath of fieldData) {
	if (filepath.includes('_defaults') || filepath.includes('index')) continue;

	const systemFields = requireYAML(path.resolve(__dirname, filepath));

	(systemFields.fields as FieldMeta[]).forEach((field, index) => {
		systemFieldRows.push(
			merge({ system: true }, defaults, field, {
				collection: systemFields.table,
				sort: index + 1,
			})
		);
	});
}
