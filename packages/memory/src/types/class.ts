import type { MemoryConfig } from "./config.js";

export interface Memory {
	get<T = unknown>(key: string): T;
	set<T = unknown>(key: string, value: T, ttl?: number): void;
}
