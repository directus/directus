import { merge } from 'lodash-es';
import type { CollectionMeta } from '../../../types/index.js';
import { getImportFilePath } from '../../../utils/importFile.js';
import { requireYAML } from '../../../utils/require-yaml.js';

const systemData = requireYAML(getImportFilePath('./database/system-data/collections/collections.yaml'));

export const systemCollectionRows: CollectionMeta[] = systemData['data'].map((row: Record<string, any>) => {
	return merge({ system: true }, systemData['defaults'], row);
});
