import { requireYAML } from '../../../utils/require-yaml';
import { merge } from 'lodash';
import { FieldMeta } from '../../../types';
import fse from 'fs-extra';
import path from 'path';

const defaults = requireYAML(require.resolve('./_defaults.yaml'));
const fieldData = fse.readdirSync(path.resolve(__dirname));

export let systemFieldRows: FieldMeta[] = [];

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
