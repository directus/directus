export interface CacheOptions {
    ttl?: number;
    namespace?: string;
}

export abstract class CacheService {

    ttl: number | undefined;
    namespace: string | undefined;

    constructor(options?: CacheOptions) {
        this.ttl = options?.ttl;
        this.namespace = options?.namespace;
    }

    abstract get(key: string): Promise<any>;
    abstract set(key: string, value: any, ttl?: number): Promise<void>;
    abstract clear(): Promise<void>;
    abstract delete(key: string): Promise<void>;

    addPrefix(key: string) {
        return this.namespace ? `${this.namespace}:${key}` : key;
    };

    removePrefix(key: string) {
        return this.namespace ? key.replace(`${this.namespace}:`, '') : key;
    }
}