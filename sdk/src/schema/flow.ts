import type { MergeCoreCollection } from '../index.js';
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
		status: 'active' | 'inactive';
		trigger: 'event' | 'schedule' | 'operation' | 'webhook' | 'manual' | null;
		accountability: 'all' | 'activity' | null;
		options: Record<string, any> | null;
		operation: DirectusOperation<Schema> | string | null;
		date_created: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
	}
>;
