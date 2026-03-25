import { PERMISSION_ACTIONS } from '@directus/constants';
import type { Filter } from './filter.js';

export type PermissionsAction = (typeof PERMISSION_ACTIONS)[number];

export type Permission = {
	id?: number;
	policy: string | null;
	collection: string;
	action: PermissionsAction;
	permissions: Filter | null;
	validation: Filter | null;
	presets: Record<string, any> | null;
	fields: string[] | null;
	system?: true;
};

export type ItemPermissions = {
	update: { access: boolean; presets?: Permission['presets']; fields?: Permission['fields'] };
	delete: { access: boolean };
	share: { access: boolean };
};

export type CollectionPermissions = {
	[action in PermissionsAction]: {
		access: 'none' | 'partial' | 'full';
		fields?: string[];
		presets?: Record<string, any>;
	};
};

export type CollectionAccess = {
	[collection: string]: CollectionPermissions;
};

export type GlobalAccess = {
	admin: boolean;
	app: boolean;
};
