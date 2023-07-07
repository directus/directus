import { merge } from 'lodash-es';
import type { CollectionMeta } from '../../../types/index.js';
import { requireYAML } from '../../../utils/require-yaml.js';
import path from 'node:path';
import { CONTEXT_ROOT } from '../../../constants.js';

const collectionsPath = path.join(CONTEXT_ROOT, 'database', 'system-data', 'collections', 'collections.yaml');
const systemData = requireYAML(collectionsPath);

export const systemCollectionRows: CollectionMeta[] = systemData['data'].map((row: Record<string, any>) => {
	return merge({ system: true }, systemData['defaults'], row);
});
