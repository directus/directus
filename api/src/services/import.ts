import { Knex } from 'knex';
import database from '../database';
import { AbstractServiceOptions, Accountability, SchemaOverview } from '../types';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import StreamArray from 'stream-json/streamers/StreamArray';
import { ItemsService } from './items';
import { queue } from 'async';
import destroyStream from 'destroy';

export class ImportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || database;
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async import(collection: string, mimetype: string, stream: NodeJS.ReadableStream) {
		if (collection.startsWith('directus_')) throw new ForbiddenException();

		const createPermissions = this.schema.permissions.find(
			(permission) => permission.collection === collection && permission.action === 'create'
		);

		const updatePermissions = this.schema.permissions.find(
			(permission) => permission.collection === collection && permission.action === 'update'
		);

		if (this.accountability?.admin !== true && (!createPermissions || !updatePermissions)) {
			throw new ForbiddenException();
		}

		switch (mimetype) {
			case 'application/json':
				return await this.importJSON(collection, stream);
			default:
				throw new InvalidPayloadException(`Can't parse files of type ${mimetype}`);
		}
	}

	importJSON(collection: string, stream: NodeJS.ReadableStream) {
		const extractJSON = StreamArray.withParser();

		return this.knex.transaction((trx) => {
			const service = new ItemsService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			const saveQueue = queue(async (value: Record<string, unknown>) => {
				return await service.upsertOne(value);
			});

			return new Promise<void>((resolve, reject) => {
				stream.pipe(extractJSON);

				extractJSON.on('data', ({ value }) => {
					saveQueue.push(value);
				});

				extractJSON.on('error', (err) => {
					destroyStream(stream);
					destroyStream(extractJSON);

					reject(new InvalidPayloadException(err.message));
				});

				saveQueue.error((err) => {
					reject(err);
				});

				extractJSON.on('end', () => {
					saveQueue.drain(() => {
						return resolve();
					});
				});
			});
		});
	}
}
