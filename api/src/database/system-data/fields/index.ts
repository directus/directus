import { requireYAML } from '../../../utils/require-yaml';
import { merge } from 'lodash';
import { FieldMeta } from '../../../types';
import fse from 'fs-extra';
import path from 'path';

const defaults = requireYAML(require.resolve('./_defaults.yaml'));
const fieldData = fse.readdirSync(path.resolve(__dirname));

export let systemFieldRows: FieldMeta[] = [];

for (const filepath of fieldData) {
	if (['_defaults.yaml', 'index.ts'].includes(filepath)) continue;

	const systemFields = requireYAML(path.resolve(__dirname, filepath));

	for (const field of systemFields.fields) {
		systemFieldRows.push(merge({}, defaults, field));
	}
}
