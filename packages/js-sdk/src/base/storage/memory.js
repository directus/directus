import { BaseStorage } from './base';
export class MemoryStorage extends BaseStorage {
    constructor() {
        super(...arguments);
        this.values = {};
    }
    get(key) {
        const k = this.key(key);
        if (k in this.values) {
            return this.values[k];
        }
        return null;
    }
    set(key, value) {
        this.values[this.key(key)] = value;
        return value;
    }
    delete(key) {
        const value = this.get(key);
        delete this.values[this.key(key)];
        return value;
    }
    key(name) {
        return `${this.prefix}${name}`;
    }
}
