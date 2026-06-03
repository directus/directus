import type { RelationMeta } from '../types.js';
import systemData from './relations.yaml';

export const systemRelationRows: RelationMeta[] = (systemData['data'] as RelationMeta[]).map(
	(row) =>
		({
			...(systemData['defaults'] as Partial<RelationMeta>),
			...row,
			system: true,
		}) as RelationMeta,
);
