import { merge } from 'lodash';
import { Relation } from '../../../types';
import { requireYAML } from '../../../utils/require-yaml';

const systemData = requireYAML(require.resolve('./relations.yaml'));

export const systemRelationRows: Relation[] = systemData.data.map((row: Record<string, any>) => {
	return merge({ system: true }, systemData.defaults, row);
});
