import { IAuth } from '../auth';
import { PasswordsHandler } from '../handlers/passwords';
export class Auth extends IAuth {
    constructor(options) {
        var _a, _b, _c;
        super();
        this.autoRefresh = true;
        this.msRefreshBeforeExpires = 30000;
        this.staticToken = '';
        this._transport = options.transport;
        this._storage = options.storage;
        this.autoRefresh = (_a = options === null || options === void 0 ? void 0 : options.autoRefresh) !== null && _a !== void 0 ? _a : this.autoRefresh;
        this.mode = (_b = options === null || options === void 0 ? void 0 : options.mode) !== null && _b !== void 0 ? _b : this.mode;
        this.msRefreshBeforeExpires = (_c = options === null || options === void 0 ? void 0 : options.msRefreshBeforeExpires) !== null && _c !== void 0 ? _c : this.msRefreshBeforeExpires;
        if (options === null || options === void 0 ? void 0 : options.staticToken) {
            this.staticToken = options === null || options === void 0 ? void 0 : options.staticToken;
            this.updateStorage({
                access_token: this.staticToken,
                expires: null,
                refresh_token: null,
            });
        }
    }
    get storage() {
        return this._storage;
    }
    get transport() {
        return this._transport;
    }
    get token() {
        return (async () => {
            if (this._refreshPromise) {
                try {
                    await this._refreshPromise;
                }
                finally {
                    this._refreshPromise = undefined;
                }
            }
            return this._storage.auth_token;
        })();
    }
    get password() {
        return (this.passwords = this.passwords || new PasswordsHandler(this._transport));
    }
    resetStorage() {
        this._storage.auth_token = null;
        this._storage.auth_refresh_token = null;
        this._storage.auth_expires = null;
        this._storage.auth_expires_at = null;
    }
    updateStorage(result) {
        var _a, _b;
        const expires = (_a = result.expires) !== null && _a !== void 0 ? _a : null;
        this._storage.auth_token = result.access_token;
        this._storage.auth_refresh_token = (_b = result.refresh_token) !== null && _b !== void 0 ? _b : null;
        this._storage.auth_expires = expires;
        this._storage.auth_expires_at = new Date().getTime() + (expires !== null && expires !== void 0 ? expires : 0);
    }
    async refreshIfExpired() {
        if (this.staticToken)
            return;
        if (!this.autoRefresh)
            return;
        if (!this._storage.auth_expires_at) {
            // wait because resetStorage() call in refresh()
            try {
                await this._refreshPromise;
            }
            finally {
                this._refreshPromise = undefined;
            }
            return;
        }
        if (this._storage.auth_expires_at < new Date().getTime() + this.msRefreshBeforeExpires) {
            this.refresh();
        }
        try {
            await this._refreshPromise; // wait for refresh
        }
        finally {
            this._refreshPromise = undefined;
        }
    }
    refresh() {
        const refreshPromise = async () => {
            var _a;
            const refresh_token = this._storage.auth_refresh_token;
            this.resetStorage();
            const response = await this._transport.post('/auth/refresh', {
                refresh_token: this.mode === 'json' ? refresh_token : undefined,
            });
            this.updateStorage(response.data);
            return {
                access_token: response.data.access_token,
                ...(((_a = response.data) === null || _a === void 0 ? void 0 : _a.refresh_token) && { refresh_token: response.data.refresh_token }),
                expires: response.data.expires,
            };
        };
        return (this._refreshPromise = refreshPromise());
    }
    async login(credentials) {
        var _a;
        this.resetStorage();
        const response = await this._transport.post('/auth/login', { mode: this.mode, ...credentials }, { headers: { Authorization: null } });
        this.updateStorage(response.data);
        return {
            access_token: response.data.access_token,
            ...(((_a = response.data) === null || _a === void 0 ? void 0 : _a.refresh_token) && {
                refresh_token: response.data.refresh_token,
            }),
            expires: response.data.expires,
        };
    }
    async static(token) {
        if (!this.staticToken)
            this.staticToken = token;
        await this._transport.get('/users/me', {
            params: { access_token: token },
            headers: { Authorization: null },
        });
        this.updateStorage({
            access_token: token,
            expires: null,
            refresh_token: null,
        });
        return true;
    }
    async logout() {
        let refresh_token;
        if (this.mode === 'json') {
            refresh_token = this._storage.auth_refresh_token || undefined;
        }
        await this._transport.post('/auth/logout', { refresh_token });
        this.updateStorage({
            access_token: null,
            expires: null,
            refresh_token: null,
        });
    }
}
