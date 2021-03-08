import { ItemsHandler } from './base/items';
import { IAuth } from './auth';
import {
	ActivityHandler,
	CollectionsHandler,
	DefaultFields,
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
	UtilsHandler,
} from './handlers';
import { Item } from './items';
import { ITransport } from './transport';

export type DirectusTypes = {
	activity: DefaultFields;
	collections: DefaultFields;
	fields: DefaultFields;
	files: DefaultFields;
	folders: DefaultFields;
	permissions: DefaultFields;
	presets: DefaultFields;
	relations: DefaultFields;
	revisions: DefaultFields;
	roles: DefaultFields;
	server: DefaultFields;
	settings: DefaultFields;
	users: DefaultFields;
	utils: DefaultFields;
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
	readonly server: ServerHandler<Pick<T, 'server'>>;
	readonly settings: SettingsHandler<Pick<T, 'settings'>>;
	readonly users: UsersHandler<Pick<T, 'users'>>;
	readonly utils: UtilsHandler<Pick<T, 'utils'>>;

	items<T extends Item>(collection: string): ItemsHandler<T>;
}
