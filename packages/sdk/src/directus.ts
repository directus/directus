import { IAuth } from './auth';
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
} from './handlers';

import { IItems } from './items';
import { ITransport } from './transport';
import { UtilsHandler } from './handlers/utils';
import { IStorage } from './storage';
import { TypeMap, TypeOf } from './types';
import { GraphQLHandler } from './handlers/graphql';
import { ISingleton } from './singleton';
import { DirectusSystemTypes } from '@directus/shared/types';

export type DirectusTypes<T> = Omit<DirectusSystemTypes, keyof T> & T;

export interface IDirectus<T extends TypeMap> {
	readonly auth: IAuth;
	readonly storage: IStorage;
	readonly transport: ITransport;

	readonly activity: ActivityHandler<TypeOf<DirectusTypes<T>, 'directus_activity'>>;
	readonly collections: CollectionsHandler<TypeOf<DirectusTypes<T>, 'directus_collections'>>;
	readonly files: FilesHandler<TypeOf<DirectusTypes<T>, 'directus_files'>>;
	readonly fields: FieldsHandler<TypeOf<DirectusTypes<T>, 'directus_fields'>>;
	readonly folders: FoldersHandler<TypeOf<DirectusTypes<T>, 'directus_folders'>>;
	readonly permissions: PermissionsHandler<TypeOf<DirectusTypes<T>, 'directus_permissions'>>;
	readonly presets: PresetsHandler<TypeOf<DirectusTypes<T>, 'directus_presets'>>;
	readonly revisions: RevisionsHandler<TypeOf<DirectusTypes<T>, 'directus_revisions'>>;
	readonly relations: RelationsHandler<TypeOf<DirectusTypes<T>, 'directus_relations'>>;
	readonly roles: RolesHandler<TypeOf<DirectusTypes<T>, 'directus_roles'>>;
	readonly users: UsersHandler<TypeOf<DirectusTypes<T>, 'directus_users'>>;
	readonly settings: SettingsHandler<TypeOf<DirectusTypes<T>, 'directus_settings'>>;
	readonly server: ServerHandler;
	readonly utils: UtilsHandler;
	readonly graphql: GraphQLHandler;

	items<C extends string, I = TypeOf<DirectusTypes<T>, C>>(collection: C): IItems<I>;
	singleton<C extends string, I = TypeOf<DirectusTypes<T>, C>>(collection: C): ISingleton<I>;
}
