import { Permission, Accountability } from '@directus/shared/types';
import { SchemaOverview } from '../types';

export function getPermissionsForShare(accountability: Accountability, schema: SchemaOverview): Permission[] {
	const { collection, item } = accountability.share_scope!;
	return [];
}
