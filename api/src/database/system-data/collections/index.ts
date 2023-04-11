import { merge } from 'lodash-es';
import type { CollectionMeta } from '../../../types/index.js';
import { requireYAML } from '../../../utils/require-yaml.js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const systemData = requireYAML(resolve(__dirname, './collections.yaml'));

export const systemCollectionRows: CollectionMeta[] = systemData['data'].map((row: Record<string, any>) => {
	return merge({ system: true }, systemData['defaults'], row);
});
