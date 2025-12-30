import type { ChunkedUploadContext, Range, ReadOptions, Stat } from '@directus/types';
import type { Readable } from 'node:stream';

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

export declare class Driver {
	constructor(config: Record<string, unknown>);

	read(filepath: string, options?: ReadOptions): Promise<Readable>;
	write(filepath: string, content: Readable, type?: string): Promise<void>;
	delete(filepath: string): Promise<void>;
	stat(filepath: string): Promise<Stat>;
	exists(filepath: string): Promise<boolean>;
	move(src: string, dest: string): Promise<void>;
	copy(src: string, dest: string): Promise<void>;
	list(prefix?: string): AsyncIterable<string>;
}

export interface TusDriver extends Driver {
	get tusExtensions(): string[];

	createChunkedUpload(filepath: string, context: ChunkedUploadContext): Promise<ChunkedUploadContext>;
	finishChunkedUpload(filepath: string, context: ChunkedUploadContext): Promise<void>;
	deleteChunkedUpload(filepath: string, context: ChunkedUploadContext): Promise<void>;
	writeChunk(filepath: string, content: Readable, offset: number, context: ChunkedUploadContext): Promise<number>;
}

export function supportsTus(driver: Driver): driver is TusDriver {
	return 'tusExtensions' in driver;
}

export type DriverConfig = {
	driver: string;
	options: Record<string, unknown>;
};

export type { Range, Stat, ReadOptions, ChunkedUploadContext };
