import { IAuth } from '../auth';
import { IDirectus } from '../directus';
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
	UtilsHandler,
} from '../handlers';
import { Item } from '../items';
import { ITransport } from '../transport';
import { ItemsHandler } from './items';
import { AxiosTransport } from './transport';
import { Auth } from './auth';
import { IStorage } from '../storage';
import { LocalStorage, MemoryStorage } from './storage';
import { TypeMap, TypeOf } from '../types';
import { GraphQLHandler } from '../handlers/graphql';

export type DirectusOptions = {
	auth?: IAuth;
	transport?: ITransport;
	storage?: IStorage;
};

export class Directus<T extends TypeMap> implements IDirectus<T> {
	private _auth: IAuth;
	private _transport: ITransport;
	private _storage: IStorage;
	private _activity?: ActivityHandler<TypeOf<T, 'activity'>>;
	private _collections?: CollectionsHandler<TypeOf<T, 'collections'>>;
	private _fields?: FieldsHandler<TypeOf<T, 'fields'>>;
	private _files?: FilesHandler<TypeOf<T, 'files'>>;
	private _folders?: FoldersHandler<TypeOf<T, 'folders'>>;
	private _permissions?: PermissionsHandler<TypeOf<T, 'permissions'>>;
	private _presets?: PresetsHandler<TypeOf<T, 'presets'>>;
	private _relations?: RelationsHandler<TypeOf<T, 'relations'>>;
	private _revisions?: RevisionsHandler<TypeOf<T, 'revisions'>>;
	private _roles?: RolesHandler<TypeOf<T, 'roles'>>;
	private _settings?: SettingsHandler<TypeOf<T, 'settings'>>;
	private _users?: UsersHandler<TypeOf<T, 'users'>>;
	private _server?: ServerHandler;
	private _utils?: UtilsHandler;
	private _graphql?: GraphQLHandler;

	private _items: {
		[collection: string]: ItemsHandler<any>;
	};

	constructor(url: string, options?: DirectusOptions) {
		this._storage = options?.storage || (typeof window !== 'undefined' ? new LocalStorage() : new MemoryStorage());
		this._transport = options?.transport || new AxiosTransport(url, this._storage);
		this._auth = options?.auth || new Auth(this._transport, this._storage);
		this._items = {};
	}

	get auth(): IAuth {
		return this._auth;
	}

	get storage(): IStorage {
		return this._storage;
	}

	get transport(): ITransport {
		return this._transport;
	}

	get activity(): ActivityHandler<TypeOf<T, 'activity'>> {
		return this._activity || (this._activity = new ActivityHandler<TypeOf<T, 'activity'>>(this.transport));
	}

	get collections(): CollectionsHandler<TypeOf<T, 'collections'>> {
		return this._collections || (this._collections = new CollectionsHandler<TypeOf<T, 'collections'>>(this.transport));
	}

	get fields(): FieldsHandler<TypeOf<T, 'fields'>> {
		return this._fields || (this._fields = new FieldsHandler<TypeOf<T, 'fields'>>(this.transport));
	}

	get files(): FilesHandler<TypeOf<T, 'files'>> {
		return this._files || (this._files = new FilesHandler<TypeOf<T, 'files'>>(this.transport));
	}

	get folders(): FoldersHandler<TypeOf<T, 'folders'>> {
		return this._folders || (this._folders = new FoldersHandler<TypeOf<T, 'folders'>>(this.transport));
	}

	get permissions(): PermissionsHandler<TypeOf<T, 'permissions'>> {
		return this._permissions || (this._permissions = new PermissionsHandler<TypeOf<T, 'permissions'>>(this.transport));
	}

	get presets(): PresetsHandler<TypeOf<T, 'presets'>> {
		return this._presets || (this._presets = new PresetsHandler<TypeOf<T, 'presets'>>(this.transport));
	}

	get relations(): RelationsHandler<TypeOf<T, 'relations'>> {
		return this._relations || (this._relations = new RelationsHandler<TypeOf<T, 'relations'>>(this.transport));
	}

	get revisions(): RevisionsHandler<TypeOf<T, 'revisions'>> {
		return this._revisions || (this._revisions = new RevisionsHandler<TypeOf<T, 'revisions'>>(this.transport));
	}

	get roles(): RolesHandler<TypeOf<T, 'roles'>> {
		return this._roles || (this._roles = new RolesHandler<TypeOf<T, 'roles'>>(this.transport));
	}

	get settings(): SettingsHandler<TypeOf<T, 'settings'>> {
		return this._settings || (this._settings = new SettingsHandler<TypeOf<T, 'settings'>>(this.transport));
	}

	get users(): UsersHandler<TypeOf<T, 'users'>> {
		return this._users || (this._users = new UsersHandler<TypeOf<T, 'users'>>(this.transport));
	}

	get server(): ServerHandler {
		return this._server || (this._server = new ServerHandler(this.transport));
	}

	get utils(): UtilsHandler {
		return this._utils || (this._utils = new UtilsHandler(this.transport));
	}

	get graphql(): GraphQLHandler {
		return this._graphql || (this._graphql = new GraphQLHandler(this.transport));
	}

	items<T extends Item>(collection: string): ItemsHandler<T> {
		return this._items[collection] || (this._items[collection] = new ItemsHandler<T>(collection, this.transport));
	}
}
