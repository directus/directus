import { PermissionsAction } from '@directus/types';

/** An info object that describes the permissions of a user for a specific action */
export interface ActionPermission {
	/** The access level the user has. 'partial' means that some items might not be available */
	access: 'none' | 'partial' | 'full';
	/** A superset of all access fields that apply to this action */
	fields?: string[];
	/** The condensed presets of the permissions that apply to this action */
	presets?: Record<string, any>;
}

export type CollectionPermission = Partial<Record<PermissionsAction, ActionPermission>>;
