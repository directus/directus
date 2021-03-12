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

export type DirectusTypes = {
	activity: {};
	collections: {};
	fields: {};
	files: {};
	folders: {};
	permissions: {};
	presets: {};
	relations: {};
	revisions: {};
	roles: {};
	settings: {};
	users: {};
};

export interface IDirectus<T extends DirectusTypes = DirectusTypes> {
	readonly auth: IAuth;
	readonly transport: ITransport;

	readonly activity: ActivityHandler<Pick<T, 'activity'>>;
	readonly collections: CollectionsHandler<Pick<T, 'collections'>>;
	readonly fields: FieldsHandler<Pick<T, 'fields'>>;
	readonly files: FilesHandler<Pick<T, 'files'>>;
	readonly folders: FoldersHandler<Pick<T, 'folders'>>;
	readonly permissions: PermissionsHandler<Pick<T, 'permissions'>>;
	readonly presets: PresetsHandler<Pick<T, 'presets'>>;
	readonly relations: RelationsHandler<Pick<T, 'relations'>>;
	readonly revisions: RevisionsHandler<Pick<T, 'revisions'>>;
	readonly roles: RolesHandler<Pick<T, 'roles'>>;
	readonly settings: SettingsHandler<Pick<T, 'settings'>>;
	readonly users: UsersHandler<Pick<T, 'users'>>;
	readonly server: ServerHandler;
	readonly utils: UtilsHandler;

	items<T extends Item>(collection: string): ItemsHandler<T>;

	gql<T>(query: string, variables: any): Promise<TransportResponse<T>>;
	graphql<T>(query: string, variables: any): Promise<TransportResponse<T>>;
}
