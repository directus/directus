import { IAuth } from '../auth';
import { DirectusTypes as DirectusFields, IDirectus } from '../directus';
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
import { ITransport, TransportResponse } from '../transport';
import { ItemsHandler } from './items';
import { AxiosTransport } from './transport';
import { Auth } from './auth';
import { IStorage } from '../storage';
import { LocalStorage, MemoryStorage } from './storage';

export type DirectusOptions = {
	auth?: IAuth;
	transport?: ITransport;
	storage?: IStorage;
};

export class Directus<T extends DirectusFields = DirectusFields> implements IDirectus<T> {
	private _auth: IAuth;
	private _transport: ITransport;
	private _storage: IStorage;
	private _activity?: ActivityHandler<Pick<T, 'activity'>>;
	private _collections?: CollectionsHandler<Pick<T, 'collections'>>;
	private _fields?: FieldsHandler<Pick<T, 'fields'>>;
	private _files?: FilesHandler<Pick<T, 'files'>>;
	private _folders?: FoldersHandler<Pick<T, 'folders'>>;
	private _permissions?: PermissionsHandler<Pick<T, 'permissions'>>;
	private _presets?: PresetsHandler<Pick<T, 'presets'>>;
	private _relations?: RelationsHandler<Pick<T, 'relations'>>;
	private _revisions?: RevisionsHandler<Pick<T, 'revisions'>>;
	private _roles?: RolesHandler<Pick<T, 'roles'>>;
	private _settings?: SettingsHandler<Pick<T, 'settings'>>;
	private _users?: UsersHandler<Pick<T, 'users'>>;
	private _server?: ServerHandler;
	private _utils?: UtilsHandler;
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

	get transport(): ITransport {
		return this._transport;
	}

	get activity(): ActivityHandler<Pick<T, 'activity'>> {
		return this._activity || (this._activity = new ActivityHandler<Pick<T, 'activity'>>(this.transport));
	}

	get collections(): CollectionsHandler<Pick<T, 'collections'>> {
		return this._collections || (this._collections = new CollectionsHandler<Pick<T, 'collections'>>(this.transport));
	}

	get fields(): FieldsHandler<Pick<T, 'fields'>> {
		return this._fields || (this._fields = new FieldsHandler<Pick<T, 'fields'>>(this.transport));
	}

	get files(): FilesHandler<Pick<T, 'files'>> {
		return this._files || (this._files = new FilesHandler<Pick<T, 'files'>>(this.transport));
	}

	get folders(): FoldersHandler<Pick<T, 'folders'>> {
		return this._folders || (this._folders = new FoldersHandler<Pick<T, 'folders'>>(this.transport));
	}

	get permissions(): PermissionsHandler<Pick<T, 'permissions'>> {
		return this._permissions || (this._permissions = new PermissionsHandler<Pick<T, 'permissions'>>(this.transport));
	}

	get presets(): PresetsHandler<Pick<T, 'presets'>> {
		return this._presets || (this._presets = new PresetsHandler<Pick<T, 'presets'>>(this.transport));
	}

	get relations(): RelationsHandler<Pick<T, 'relations'>> {
		return this._relations || (this._relations = new RelationsHandler<Pick<T, 'relations'>>(this.transport));
	}

	get revisions(): RevisionsHandler<Pick<T, 'revisions'>> {
		return this._revisions || (this._revisions = new RevisionsHandler<Pick<T, 'revisions'>>(this.transport));
	}

	get roles(): RolesHandler<Pick<T, 'roles'>> {
		return this._roles || (this._roles = new RolesHandler<Pick<T, 'roles'>>(this.transport));
	}

	get settings(): SettingsHandler<Pick<T, 'settings'>> {
		return this._settings || (this._settings = new SettingsHandler<Pick<T, 'settings'>>(this.transport));
	}

	get users(): UsersHandler<Pick<T, 'users'>> {
		return this._users || (this._users = new UsersHandler<Pick<T, 'users'>>(this.transport));
	}

	get server(): ServerHandler {
		return this._server || (this._server = new ServerHandler(this.transport));
	}

	get utils(): UtilsHandler {
		return this._utils || (this._utils = new UtilsHandler(this.transport));
	}

	items<T extends Item>(collection: string): ItemsHandler<T> {
		return this._items[collection] || (this._items[collection] = new ItemsHandler<T>(collection, this.transport));
	}

	async gql<T>(query: string, variables?: any): Promise<TransportResponse<T>> {
		return this.graphql(query, variables);
	}

	async graphql<T>(query: string, variables?: any): Promise<TransportResponse<T>> {
		return await this.transport.post<T>('/graphql', {
			query,
			variables: typeof variables === 'undefined' ? {} : variables,
		});
	}
}
