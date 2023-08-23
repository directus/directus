import type { MergeCoreCollection } from '../index.js';
import type { DirectusRole } from './role.js';

export type DirectusPermission<Schema extends object> = MergeCoreCollection<
	Schema,
	'directus_permissions',
	{
		id: number;
		role: DirectusRole<Schema> | string | null;
		collection: string; // TODO keyof complete schema
		action: string;
		permissions: 'json' | null;
		validation: 'json' | null;
		presets: 'json' | null;
		fields: string | null;
	}
>;
