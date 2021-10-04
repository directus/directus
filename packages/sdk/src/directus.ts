import { IAuth } from '@/src/auth.js';
import {
	ActivityHandler,
	CollectionsHandler,
	FieldsHandler,
	FilesHandler,
	FoldersHandler,
	PermissionsHandler,
	PresetsHandler,
	RelationsHandler,
	RevisionsHandler,
	RolesHandler,
	ServerHandler,
	SettingsHandler,
	UsersHandler,
} from '@/src/handlers/index.js';

import { IItems } from '@/src/items.js';
import { ITransport } from '@/src/transport.js';
import { UtilsHandler } from '@/src/handlers/utils.js';
import { IStorage } from '@/src/storage.js';
import { TypeMap, TypeOf } from '@/src/types.js';
import { GraphQLHandler } from '@/src/handlers/graphql.js';
import { ISingleton } from '@/src/singleton.js';

export type DirectusTypes = {
	activity: undefined;
	collections: undefined;
	fields: undefined;
	files: undefined;
	folders: undefined;
	permissions: undefined;
	presets: undefined;
	relations: undefined;
	revisions: undefined;
	roles: undefined;
	settings: undefined;
	users: undefined;
};

export interface IDirectus<T extends TypeMap> {
	readonly auth: IAuth;
	readonly storage: IStorage;
	readonly transport: ITransport;

	readonly activity: ActivityHandler<TypeOf<T, 'directus_activity'>>;
	readonly collections: CollectionsHandler<TypeOf<T, 'directus_collections'>>;
	readonly files: FilesHandler<TypeOf<T, 'directus_files'>>;
	readonly fields: FieldsHandler<TypeOf<T, 'directus_fields'>>;
	readonly folders: FoldersHandler<TypeOf<T, 'directus_folders'>>;
	readonly permissions: PermissionsHandler<TypeOf<T, 'directus_permissions'>>;
	readonly presets: PresetsHandler<TypeOf<T, 'directus_presets'>>;
	readonly revisions: RevisionsHandler<TypeOf<T, 'directus_revisions'>>;
	readonly relations: RelationsHandler<TypeOf<T, 'directus_relations'>>;
	readonly roles: RolesHandler<TypeOf<T, 'directus_roles'>>;
	readonly users: UsersHandler<TypeOf<T, 'directus_users'>>;
	readonly settings: SettingsHandler<TypeOf<T, 'directus_settings'>>;
	readonly server: ServerHandler;
	readonly utils: UtilsHandler;
	readonly graphql: GraphQLHandler;

	items<C extends string, I = TypeOf<T, C>>(collection: C): IItems<I>;
	singleton<C extends string, I = TypeOf<T, C>>(collection: C): ISingleton<I>;
}
