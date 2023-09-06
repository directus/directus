import type { MergeCoreCollection } from '../index.js';
import type { DirectusUser } from './user.js';
import type { DirectusOperation } from './operation.js';

export type DirectusFlow<Schema extends object> = MergeCoreCollection<
	Schema,
	'directus_flows',
	{
		id: string;
		name: string;
		icon: string | null;
		color: string | null;
		description: string | null;
		status: string;
		trigger: string | null;
		accountability: string | null;
		options: Record<string, any> | null;
		operation: DirectusOperation<Schema> | string | null;
		date_created: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
	}
>;
