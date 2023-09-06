import type { MergeCoreCollection } from '../index.js';
import type { DirectusUser } from './user.js';
import type { DirectusDashboard } from './dashboard.js';

export type DirectusPanel<Schema extends object> = MergeCoreCollection<
	Schema,
	'directus_panels',
	{
		id: string;
		dashboard: DirectusDashboard<Schema> | string;
		name: string | null;
		icon: string | null;
		color: string | null;
		show_header: boolean;
		note: string | null;
		type: string;
		position_x: number;
		position_y: number;
		width: number;
		height: number;
		options: Record<string, any> | null;
		date_created: 'datetime' | null;
		user_created: DirectusUser<Schema> | string | null;
	}
>;
