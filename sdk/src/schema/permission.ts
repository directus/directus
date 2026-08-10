import type { CompleteSchema, MergeCoreCollection } from '../index.js';
import type { DirectusPolicy } from './policy.js';

export type DirectusPermission<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_permissions',
	{
		id: number;
		policy: DirectusPolicy<Schema> | string | null;
		collection: keyof CompleteSchema<Schema>;
		action: string;
		permissions: Record<string, any> | null;
		validation: Record<string, any> | null;
		presets: Record<string, any> | null;
		fields: string[] | null;
	}
>;
