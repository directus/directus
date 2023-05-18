import { BaseStorage } from './base';
export class LocalStorage extends BaseStorage {
    get(key) {
        const value = localStorage.getItem(this.key(key));
        if (value !== null) {
            return value;
        }
        return null;
    }
    set(key, value) {
        localStorage.setItem(this.key(key), value);
        return value;
    }
    delete(key) {
        const value = this.get(key);
        localStorage.removeItem(this.key(key));
        return value;
    }
    key(name) {
        return `${this.prefix}${name}`;
    }
}
