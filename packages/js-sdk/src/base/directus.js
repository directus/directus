import { IAuth } from '../auth';
import { ActivityHandler, AssetsHandler, CollectionsHandler, FieldsHandler, FilesHandler, FoldersHandler, PermissionsHandler, PresetsHandler, RelationsHandler, RevisionsHandler, RolesHandler, ServerHandler, SettingsHandler, UsersHandler, UtilsHandler, } from '../handlers';
import { ITransport } from '../transport';
import { ItemsHandler } from './items';
import { Transport } from './transport';
import { Auth } from './auth';
import { IStorage } from '../storage';
import { LocalStorage, MemoryStorage } from './storage';
import { GraphQLHandler } from '../handlers/graphql';
import { SingletonHandler } from '../handlers/singleton';
export class Directus {
    constructor(url, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this._url = url;
        this._options = options;
        this._items = {};
        this._singletons = {};
        if (((_a = this._options) === null || _a === void 0 ? void 0 : _a.storage) && ((_b = this._options) === null || _b === void 0 ? void 0 : _b.storage) instanceof IStorage)
            this._storage = this._options.storage;
        else {
            const directusStorageOptions = (_c = this._options) === null || _c === void 0 ? void 0 : _c.storage;
            const { mode, ...storageOptions } = directusStorageOptions !== null && directusStorageOptions !== void 0 ? directusStorageOptions : {};
            if (mode === 'MemoryStorage' || typeof window === 'undefined') {
                this._storage = new MemoryStorage(storageOptions);
            }
            else {
                this._storage = new LocalStorage(storageOptions);
            }
        }
        if (((_d = this._options) === null || _d === void 0 ? void 0 : _d.transport) && ((_e = this._options) === null || _e === void 0 ? void 0 : _e.transport) instanceof ITransport)
            this._transport = this._options.transport;
        else {
            this._transport = new Transport({
                url: this.url,
                ...(_f = this._options) === null || _f === void 0 ? void 0 : _f.transport,
                beforeRequest: async (config) => {
                    var _a, _b, _c, _d, _e, _f;
                    if (this._url.indexOf('/auth/refresh') === -1 && ((_a = config.method) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== 'post') {
                        await this._auth.refreshIfExpired();
                    }
                    const token = this.storage.auth_token;
                    const bearer = token
                        ? token.startsWith(`Bearer `)
                            ? String(this.storage.auth_token)
                            : `Bearer ${this.storage.auth_token}`
                        : '';
                    const authenticatedConfig = {
                        ...config,
                        headers: {
                            Authorization: bearer,
                            ...config.headers,
                        },
                    };
                    if (!(((_b = this._options) === null || _b === void 0 ? void 0 : _b.transport) instanceof ITransport) && ((_d = (_c = this._options) === null || _c === void 0 ? void 0 : _c.transport) === null || _d === void 0 ? void 0 : _d.beforeRequest)) {
                        return (_f = (_e = this._options) === null || _e === void 0 ? void 0 : _e.transport) === null || _f === void 0 ? void 0 : _f.beforeRequest(authenticatedConfig);
                    }
                    return authenticatedConfig;
                },
            });
        }
        if (((_g = this._options) === null || _g === void 0 ? void 0 : _g.auth) && ((_h = this._options) === null || _h === void 0 ? void 0 : _h.auth) instanceof IAuth)
            this._auth = this._options.auth;
        else
            this._auth = new Auth({
                transport: this._transport,
                storage: this._storage,
                ...(_j = this._options) === null || _j === void 0 ? void 0 : _j.auth,
            });
    }
    get url() {
        return this._url;
    }
    get auth() {
        return this._auth;
    }
    get storage() {
        return this._storage;
    }
    get transport() {
        return this._transport;
    }
    get assets() {
        return this._assets || (this._assets = new AssetsHandler(this.transport));
    }
    get activity() {
        return this._activity || (this._activity = new ActivityHandler(this.transport));
    }
    get collections() {
        return (this._collections ||
            (this._collections = new CollectionsHandler(this.transport)));
    }
    get fields() {
        return this._fields || (this._fields = new FieldsHandler(this.transport));
    }
    get files() {
        return this._files || (this._files = new FilesHandler(this.transport));
    }
    get folders() {
        return this._folders || (this._folders = new FoldersHandler(this.transport));
    }
    get permissions() {
        return (this._permissions ||
            (this._permissions = new PermissionsHandler(this.transport)));
    }
    get presets() {
        return this._presets || (this._presets = new PresetsHandler(this.transport));
    }
    get relations() {
        return this._relations || (this._relations = new RelationsHandler(this.transport));
    }
    get revisions() {
        return this._revisions || (this._revisions = new RevisionsHandler(this.transport));
    }
    get roles() {
        return this._roles || (this._roles = new RolesHandler(this.transport));
    }
    get users() {
        return this._users || (this._users = new UsersHandler(this.transport));
    }
    get settings() {
        return this._settings || (this._settings = new SettingsHandler(this.transport));
    }
    get server() {
        return this._server || (this._server = new ServerHandler(this.transport));
    }
    get utils() {
        return this._utils || (this._utils = new UtilsHandler(this.transport));
    }
    get graphql() {
        return this._graphql || (this._graphql = new GraphQLHandler(this.transport));
    }
    singleton(collection) {
        return (this._singletons[collection] ||
            (this._singletons[collection] = new SingletonHandler(collection, this.transport)));
    }
    items(collection) {
        return this._items[collection] || (this._items[collection] = new ItemsHandler(collection, this.transport));
    }
}
