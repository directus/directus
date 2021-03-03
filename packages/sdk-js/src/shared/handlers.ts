import { ItemsHandler } from '../core/items';
import { ITransport } from './transport';

/**
 * Default fields
 */
export type DefaultFields = {};

/**
 * Activity handler
 */

export type Activity<T extends object = DefaultFields> = {
	// Activity Fields
} & T;

export class ActivityHandler<T extends object> extends ItemsHandler<Activity<T>> {
	constructor(transport: ITransport) {
		super('directus_activity', transport);
	}
}

/**
 * Collections handler
 */

export type Collections<T extends object = DefaultFields> = {
	// Collections Fields
} & T;

export class CollectionsHandler<T extends object> extends ItemsHandler<Collections<T>> {
	constructor(transport: ITransport) {
		super('directus_collections', transport);
	}
}

/**
 * Fields handler
 */

export type Fields<T extends object = DefaultFields> = {
	// Fields Fields
} & T;

export class FieldsHandler<T extends object> extends ItemsHandler<Fields<T>> {
	constructor(transport: ITransport) {
		super('directus_fields', transport);
	}
}

/**
 * Files handler
 */

export type Files<T extends object = DefaultFields> = {
	// Files Fields
} & T;

export class FilesHandler<T extends object> extends ItemsHandler<Files<T>> {
	constructor(transport: ITransport) {
		super('directus_files', transport);
	}
}

/**
 * Folders handler
 */

export type Folders<T extends object = DefaultFields> = {
	// Folders Fields
} & T;

export class FoldersHandler<T extends object> extends ItemsHandler<Folders<T>> {
	constructor(transport: ITransport) {
		super('directus_folders', transport);
	}
}

/**
 * Permissions handler
 */

export type Permissions<T extends object = DefaultFields> = {
	// Permissions Fields
} & T;

export class PermissionsHandler<T extends object> extends ItemsHandler<Permissions<T>> {
	constructor(transport: ITransport) {
		super('directus_permissions', transport);
	}
}

/**
 * Presets handler
 */

export type Presets<T extends object = DefaultFields> = {
	// Presets Fields
} & T;

export class PresetsHandler<T extends object> extends ItemsHandler<Presets<T>> {
	constructor(transport: ITransport) {
		super('directus_presets', transport);
	}
}

/**
 * Relations handler
 */

export type Relations<T extends object = DefaultFields> = {
	// Relations Fields
} & T;

export class RelationsHandler<T extends object> extends ItemsHandler<Relations<T>> {
	constructor(transport: ITransport) {
		super('directus_relations', transport);
	}
}

/**
 * Revisions handler
 */

export type Revisions<T extends object = DefaultFields> = {
	// Revisions Fields
} & T;

export class RevisionsHandler<T extends object> extends ItemsHandler<Revisions<T>> {
	constructor(transport: ITransport) {
		super('directus_revisions', transport);
	}
}

/**
 * Roles handler
 */

export type Roles<T extends object = DefaultFields> = {
	// Roles Fields
} & T;

export class RolesHandler<T extends object> extends ItemsHandler<Roles<T>> {
	constructor(transport: ITransport) {
		super('directus_roles', transport);
	}
}

/**
 * Server handler
 */

export type Server<T extends object = DefaultFields> = {
	// Server Fields
} & T;

export class ServerHandler<T extends object> extends ItemsHandler<Server<T>> {
	constructor(transport: ITransport) {
		super('directus_server', transport);
	}
}

/**
 * Settings handler
 */

export type Settings<T extends object = DefaultFields> = {
	// Settings Fields
} & T;

export class SettingsHandler<T extends object> extends ItemsHandler<Settings<T>> {
	constructor(transport: ITransport) {
		super('directus_settings', transport);
	}
}

/**
 * Users handler
 */

export type Users<T extends object = DefaultFields> = {
	// Users Fields
} & T;

export class UsersHandler<T extends object> extends ItemsHandler<Users<T>> {
	constructor(transport: ITransport) {
		super('directus_users', transport);
	}
}

/**
 * Utils handler
 */

export type Utils<T extends object = DefaultFields> = {
	// Utils Fields
} & T;

export class UtilsHandler<T extends object> extends ItemsHandler<Utils<T>> {
	constructor(transport: ITransport) {
		super('directus_utils', transport);
	}
}
