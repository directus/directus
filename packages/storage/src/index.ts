import type { Driver, DriverConfig } from './types';

export type { Driver } from './types';

export class StorageManager {
	#drivers = new Map<string, typeof Driver>();
	#locations = new Map<string, Driver>();

	async registerDriver(name: string, driver: typeof Driver) {
		this.#drivers.set(name, driver);
	}

	async registerLocation(name: string, config: DriverConfig) {
		const driverName = config.name;

		const Driver = this.#drivers.get(driverName);

		if (!Driver) {
			throw new Error(`Driver ${driverName} isn't registered.`);
		}

		this.#locations.set(name, new Driver(config));
	}

	location(name: string) {
		const driver = this.#locations.get(name);

		if (!driver) {
			throw new Error(`Location ${name} doesn't exist.`);
		}

		return driver;
	}
}
