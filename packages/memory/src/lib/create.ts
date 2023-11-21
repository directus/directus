import type { MemoryConfig } from "../types/config.js"
import { MemoryLocal } from "./local.js"
import { MemoryMulti } from "./multi.js"
import { MemoryRedis } from "./redis.js"

export const createMemory = (config: MemoryConfig) => {
	if (config.type === 'local') {
		return new MemoryLocal(config);
	}

	if (config.type === 'redis') {
		return new MemoryRedis(config);
	}

	if (config.type === 'multi') {
		return new MemoryMulti(config);
	}

	throw new Error(`Invalid configuration: Type does not exist.`);
}
