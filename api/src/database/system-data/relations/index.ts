import type { RelationMeta } from '@directus/types';
import { merge } from 'lodash-es';
import { requireYAML } from '../../../utils/require-yaml.js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const systemData = requireYAML(resolve(__dirname, './relations.yaml')) as {
	data: RelationMeta[];
	defaults: Partial<RelationMeta>;
};

export const systemRelationRows: RelationMeta[] = systemData.data.map((row) => {
	return merge({ system: true }, systemData.defaults, row);
});
