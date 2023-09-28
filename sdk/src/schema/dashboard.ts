import type { MergeCoreCollection } from '../index.js';
import type { DirectusUser } from './user.js';

export type DirectusDashboard<Schema extends object> = MergeCoreCollection<
	Schema,
	'directus_dashboards',
	{
		id: string;
		name: string;
		icon: string;
		note: string | null;
		date_created: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
		color: string | null;
	}
>;
