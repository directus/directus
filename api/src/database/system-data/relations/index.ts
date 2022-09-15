import { merge } from 'lodash-es';
import type { RelationMeta } from '@directus/shared/types';
import { requireYAML } from '../../../utils/require-yaml.js';
import { getImportFilePath } from '../../../utils/importFile.js';

const systemData = requireYAML(getImportFilePath('./database/system-data/relations/relations.yaml')) as {
	data: RelationMeta[];
	defaults: Partial<RelationMeta>;
};

export const systemRelationRows: RelationMeta[] = systemData.data.map((row) => {
	return merge({ system: true }, systemData.defaults, row);
});
