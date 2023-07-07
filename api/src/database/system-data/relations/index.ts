import type { RelationMeta } from '@directus/types';
import { merge } from 'lodash-es';
import path from 'node:path';
import { CONTEXT_ROOT } from '../../../constants.js';
import { requireYAML } from '../../../utils/require-yaml.js';

const relationsPath = path.join(CONTEXT_ROOT, 'database', 'system-data', 'relations', 'relations.yaml');

const systemData = requireYAML(relationsPath) as {
	data: RelationMeta[];
	defaults: Partial<RelationMeta>;
};

export const systemRelationRows: RelationMeta[] = systemData.data.map((row) => {
	return merge({ system: true }, systemData.defaults, row);
});
