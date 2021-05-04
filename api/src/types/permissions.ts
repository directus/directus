import { Filter } from './query';

export type PermissionsAction = 'create' | 'read' | 'update' | 'delete' | 'comment' | 'explain';

export type Permission = {
	id?: number;
	role: string | null;
	collection: string;
	action: PermissionsAction;
	permissions: Record<string, any>;
	validation: Filter | null;
	limit: number | null;
	presets: Record<string, any> | null;
	fields: string[] | null;
	system?: true;
};
