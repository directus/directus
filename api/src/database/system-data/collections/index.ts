import { requireYAML } from '../../../utils/require-yaml';
import { merge } from 'lodash';
import { CollectionMeta } from '../../../types';

const systemData = requireYAML(require.resolve('./collections.yaml'));

export const systemCollectionRows: CollectionMeta[] = systemData.data.map((row: Record<string, any>) => {
	return merge({ system: true }, systemData.defaults, row);
});
