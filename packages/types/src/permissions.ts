import type { Filter } from './filter.js';

export type PermissionsAction = 'create' | 'read' | 'update' | 'delete' | 'comment' | 'explain' | 'share';

export type Permission = {
	id?: number;
	role: string | null;
	collection: string;
	action: PermissionsAction;
	permissions: Filter | null;
	validation: Filter | null;
	presets: Record<string, any> | null;
	fields: string[] | null;
	system?: true;
};
