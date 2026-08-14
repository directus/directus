import type { MergeCoreCollection, StringLiteralUnion } from '../index.js';
import type { DirectusOperation } from './operation.js';
import type { DirectusUser } from './user.js';

export type DirectusFlow<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_flows',
	{
		id: string;
		name: string;
		icon: string | null;
		color: string | null;
		description: string | null;
		status: StringLiteralUnion<'active' | 'inactive'>;
		trigger: StringLiteralUnion<'event' | 'schedule' | 'operation' | 'webhook' | 'manual'> | null;
		accountability: StringLiteralUnion<'all' | 'activity'> | null;
		options: Record<string, any> | null;
		operation: DirectusOperation<Schema> | string | null;
		date_created: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
	}
>;
