import { PermissionsAction } from '@directus/types';

/** An info object that describes the permissions of a user for a specific action */
export interface ActionPermission {
	/** The user has access to the action but might be restricted by a permission filter for some items */
	access: boolean;
	/** The user has full access to the action that is not limited by a permission filter */
	full_access: boolean;
	/** A superset of all access fields that apply to this action */
	fields?: string[];
	/** The condensed presets of the permissions that apply to this action */
	presets?: Record<string, any>;
}

export type CollectionPermission = Partial<Record<PermissionsAction, ActionPermission>>;
