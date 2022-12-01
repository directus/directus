export class StorageManager {
	private drivers = new Map<string, typeof Driver>();
	private locations = new Map<string, Driver>();

	registerDriver(name: string, driver: typeof Driver) {
		this.drivers.set(name, driver);
	}

	registerLocation(name: string, config: DriverConfig) {
		const driverName = config.driver;

		const Driver = this.drivers.get(driverName);

		if (!Driver) {
			throw new Error(`Driver "${driverName}" isn't registered.`);
		}

		this.locations.set(name, new Driver(config.options));
	}

	location(name: string) {
		const driver = this.locations.get(name);

		if (!driver) {
			throw new Error(`Location "${name}" doesn't exist.`);
		}

		return driver;
	}
}

type RangeStart = {
	start: number;
};

type RangeEnd = {
	end: number;
};

export type Range = RangeStart | RangeEnd | (RangeStart & RangeEnd);

export type Stat = {
	size: number;
	modified: Date;
};

export declare class Driver {
	constructor(config: Record<string, unknown>);

	getStream(filepath: string, range?: Range): Promise<NodeJS.ReadableStream>;
	getBuffer(filepath: string): Promise<Buffer>;
	getStat(filepath: string): Promise<Stat>;
	exists(filepath: string): Promise<boolean>;
	put(filepath: string, content: string | Buffer | NodeJS.ReadableStream): Promise<void>;
	delete(filepath: string): Promise<void>;
	move(src: string, dest: string): Promise<void>;
	copy(src: string, dest: string): Promise<void>;
	flatList(prefix?: string): AsyncIterable<string>;
}

export type DriverConfig = {
	driver: string;
	options: Record<string, unknown>;
};
