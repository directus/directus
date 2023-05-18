import { IStorage } from '../../storage';
var Keys;
(function (Keys) {
    Keys["AuthToken"] = "auth_token";
    Keys["RefreshToken"] = "auth_refresh_token";
    Keys["Expires"] = "auth_expires";
    Keys["ExpiresAt"] = "auth_expires_at";
})(Keys || (Keys = {}));
export class BaseStorage extends IStorage {
    constructor(options) {
        var _a;
        super();
        this.prefix = (_a = options === null || options === void 0 ? void 0 : options.prefix) !== null && _a !== void 0 ? _a : '';
    }
    get auth_token() {
        return this.get(Keys.AuthToken);
    }
    set auth_token(value) {
        if (value === null) {
            this.delete(Keys.AuthToken);
        }
        else {
            this.set(Keys.AuthToken, value);
        }
    }
    get auth_expires() {
        const value = this.get(Keys.Expires);
        if (value === null) {
            return null;
        }
        return parseInt(value);
    }
    set auth_expires(value) {
        if (value === null) {
            this.delete(Keys.Expires);
        }
        else {
            this.set(Keys.Expires, value.toString());
        }
    }
    get auth_expires_at() {
        const value = this.get(Keys.ExpiresAt);
        if (value === null) {
            return null;
        }
        return parseInt(value);
    }
    set auth_expires_at(value) {
        if (value === null) {
            this.delete(Keys.ExpiresAt);
        }
        else {
            this.set(Keys.ExpiresAt, value.toString());
        }
    }
    get auth_refresh_token() {
        return this.get(Keys.RefreshToken);
    }
    set auth_refresh_token(value) {
        if (value === null) {
            this.delete(Keys.RefreshToken);
        }
        else {
            this.set(Keys.RefreshToken, value);
        }
    }
}
