import type { Accountability, Item, PrimaryKey, Query/*, SchemaOverview*/ } from '@directus/types';
import { DataStore } from '@tus/utils';
import type { Logger } from 'pino';
import type { Knex } from 'knex';

// type AbstractServiceOptions = {
// 	knex?: Knex | undefined;
// 	accountability?: Accountability | null | undefined;
// 	schema: SchemaOverview;
// }

type AbstractService = {
	knex: Knex;
	accountability: Accountability | null | undefined;

	createOne(data: Partial<Item>): Promise<PrimaryKey>;
	createMany(data: Partial<Item>[]): Promise<PrimaryKey[]>;

	readOne(key: PrimaryKey, query?: Query): Promise<Item>;
	readMany(keys: PrimaryKey[], query?: Query): Promise<Item[]>;
	readByQuery(query: Query): Promise<Item[]>;

	updateOne(key: PrimaryKey, data: Partial<Item>): Promise<PrimaryKey>;
	updateMany(keys: PrimaryKey[], data: Partial<Item>): Promise<PrimaryKey[]>;

	deleteOne(key: PrimaryKey): Promise<PrimaryKey>;
	deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
};

export type TusDataStoreConfig = {
    constants: {
        ENABLED: boolean;
        CHUNK_SIZE: number;
        MAX_SIZE: number;
        EXPIRATION_TIME: number;
        SCHEDULE: string;
    };
    options: Record<string, unknown>;
    logger: Logger<never>;
}


export class TusDataStore extends DataStore {
	chunkSize: number;
	maxSize: number;
	expirationTime: number;
	logger: Logger<never>;
	protected service: AbstractService | undefined;

	constructor(config: TusDataStoreConfig) {
		super();

		this.chunkSize = config.constants.CHUNK_SIZE;
		this.maxSize = config.constants.MAX_SIZE;
		this.expirationTime = config.constants.EXPIRATION_TIME;
		this.logger = config.logger;
		this.service = undefined;
	}

	getService(): AbstractService {
		if (!this.service) throw new Error('no service set');
		return this.service;
	}

	setService(service: AbstractService) {
		this.service = service;
	}

	override getExpiration(): number {
		return this.expirationTime;
	}
}
