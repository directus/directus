import type { Memory } from "../types/class.js";
import type { MemoryConfigLocal } from '../types/config.js';

export class MemoryLocal implements Memory {
	constructor(config: MemoryConfigLocal) {

	}

	get<T = unknown>(key: string) {
		return 'x' as T;
	}

	set(key: string, value: unknown) {

	}
}
