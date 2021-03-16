import { ItemsHandler } from './base/items';
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

import { Item } from './items';
import { ITransport, TransportResponse } from './transport';
import { UtilsHandler } from './handlers/utils';
import { IStorage } from './storage';
import { TypeMap, TypeOf } from './types';

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

	readonly activity: ActivityHandler<TypeOf<T, 'activity'>>;
	readonly collections: CollectionsHandler<TypeOf<T, 'collections'>>;
	readonly fields: FieldsHandler<TypeOf<T, 'fields'>>;
	readonly files: FilesHandler<TypeOf<T, 'files'>>;
	readonly folders: FoldersHandler<TypeOf<T, 'folders'>>;
	readonly permissions: PermissionsHandler<TypeOf<T, 'permissions'>>;
	readonly presets: PresetsHandler<TypeOf<T, 'presets'>>;
	readonly relations: RelationsHandler<TypeOf<T, 'relations'>>;
	readonly revisions: RevisionsHandler<TypeOf<T, 'revisions'>>;
	readonly roles: RolesHandler<TypeOf<T, 'roles'>>;
	readonly settings: SettingsHandler<TypeOf<T, 'settings'>>;
	readonly users: UsersHandler<TypeOf<T, 'users'>>;
	readonly server: ServerHandler;
	readonly utils: UtilsHandler;

	items<T extends Item>(collection: string): ItemsHandler<T>;

	gql<T>(query: string, variables: any): Promise<TransportResponse<T>>;
	graphql<T>(query: string, variables: any): Promise<TransportResponse<T>>;
}
