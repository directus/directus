import type { RelationMeta } from '@directus/types';
import systemData from './relations.yaml';

export const systemRelationRows: RelationMeta[] = (systemData.data as RelationMeta[])
	.map((row: RelationMeta) => ({
		system: true,
		...(systemData.defaults as Partial<RelationMeta>),
		...row
	}));
