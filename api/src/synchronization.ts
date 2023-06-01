import { Redis } from 'ioredis';
import env from './env.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';

interface SynchronizationManager {
	set(key: string, value: string | number): Promise<void>;
	get(key: string): Promise<string | null>;
	delete(key: string): Promise<void>;
	exists(key: string): Promise<boolean>;
	setGreaterThan(key: string, value: number): Promise<boolean>;
}

let synchronizationManager: SynchronizationManager;

function getSynchronizationManager() {
	if (synchronizationManager) return synchronizationManager;

	if (env['SYNCHRONIZATION_STORE'] === 'redis') {
		synchronizationManager = new SynchronizationManagerRedis();
	} else {
		synchronizationManager = new SynchronizationManagerMemory();
	}

	return synchronizationManager;
}

class SynchronizationManagerMemory implements SynchronizationManager {
	private store: Record<string, string>;

	constructor() {
		this.store = {};
	}

	public async set(key: string, value: string | number): Promise<void> {
		this.setSync(key, value);
	}

	public async get(key: string): Promise<string | null> {
		return this.getSync(key);
	}

	public async delete(key: string): Promise<void> {
		this.deleteSync(key);
	}

	public async exists(key: string): Promise<boolean> {
		return this.existsSync(key);
	}

	public async setGreaterThan(key: string, value: number): Promise<boolean> {
		if (this.existsSync(key)) {
			const oldValue = Number(this.getSync(key));

			if (value <= oldValue) {
				return false;
			}
		}

		this.setSync(key, value);

		return true;
	}

	private setSync(key: string, value: string | number): void {
		this.store[key] = String(value);
	}

	private getSync(key: string): string | null {
		return this.store[key] ?? null;
	}

	private deleteSync(key: string): void {
		delete this.store[key];
	}

	private existsSync(key: string): boolean {
		return key in this.store;
	}
}

const SET_GREATER_THAN_SCRIPT = `
  local key = KEYS[1]
  local value = tonumber(ARGV[1])

  if redis.call("EXISTS", key) == 1 then
    local oldValue = tonumber(redis.call('GET', key))

    if value <= oldValue then
      return false
    end
  end

  redis.call('SET', key, value)

  return true
`;

class SynchronizationManagerRedis implements SynchronizationManager {
	private namespace: string;
	private client: Redis;

	constructor() {
		const config = getConfigFromEnv('SYNCHRONIZATION_REDIS');

		this.client = new Redis(env['SYNCHRONIZATION_REDIS'] ?? config);
		this.namespace = env['SYNCHRONIZATION_NAMESPACE'] ?? 'directus';

		this.client.defineCommand('setGreaterThan', {
			numberOfKeys: 1,
			lua: SET_GREATER_THAN_SCRIPT,
		});
	}

	public async set(key: string, value: string | number): Promise<void> {
		await this.client.set(this.getNamespacedKey(key), value);
	}

	public get(key: string): Promise<string | null> {
		return this.client.get(this.getNamespacedKey(key));
	}

	public async delete(key: string): Promise<void> {
		await this.client.del(this.getNamespacedKey(key));
	}

	public async exists(key: string): Promise<boolean> {
		const doesExist = await this.client.exists(this.getNamespacedKey(key));

		return doesExist === 1;
	}

	public async setGreaterThan(key: string, value: number): Promise<boolean> {
		const client = this.client as Redis & {
			setGreaterThan(key: string, value: number): Promise<number>;
		};

		const wasSet = await client.setGreaterThan(this.getNamespacedKey(key), value);

		return wasSet === 1;
	}

	private getNamespacedKey(key: string): string {
		return `${this.namespace}:${key}`;
	}
}

export class SynchronizedClock {
	private key: string;
	private synchronizationManager: SynchronizationManager;

	constructor(id: string) {
		this.key = `clock:${id}`;
		this.synchronizationManager = getSynchronizationManager();
	}

	public async set(timestamp: number): Promise<boolean> {
		const wasSet = await this.synchronizationManager.setGreaterThan(this.key, timestamp);

		return wasSet;
	}

	public async reset(): Promise<void> {
		await this.synchronizationManager.delete(this.key);
	}
}
