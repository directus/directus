import { Knex } from 'knex';
import getDatabase from '../database';
import { AbstractServiceOptions, SchemaOverview } from '../types';
import { Accountability } from '@directus/shared/types';
import { ForbiddenException, InvalidPayloadException, UnsupportedMediaTypeException } from '../exceptions';
import StreamArray from 'stream-json/streamers/StreamArray';
import { ItemsService } from './items';
import { queue } from 'async';
import destroyStream from 'destroy';
import csv from 'csv-parser';
import { set, transform } from 'lodash';

export class ImportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async import(collection: string, mimetype: string, stream: NodeJS.ReadableStream): Promise<void> {
		if (collection.startsWith('directus_')) throw new ForbiddenException();

		const createPermissions = this.accountability?.permissions?.find(
			(permission) => permission.collection === collection && permission.action === 'create'
		);

		const updatePermissions = this.accountability?.permissions?.find(
			(permission) => permission.collection === collection && permission.action === 'update'
		);

		if (this.accountability?.admin !== true && (!createPermissions || !updatePermissions)) {
			throw new ForbiddenException();
		}

		switch (mimetype) {
			case 'application/json':
				return await this.importJSON(collection, stream);
			case 'text/csv':
				return await this.importCSV(collection, stream);
			default:
				throw new UnsupportedMediaTypeException(`Can't import files of type "${mimetype}"`);
		}
	}

	importJSON(collection: string, stream: NodeJS.ReadableStream): Promise<void> {
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

	importCSV(collection: string, stream: NodeJS.ReadableStream): Promise<void> {
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
				stream
					.pipe(csv())
					.on('data', (value: Record<string, string>) => {
						const obj = transform(value, (result: Record<string, string>, value, key) => {
							if (value.length === 0) {
								delete result[key];
							} else {
								try {
									const parsedJson = JSON.parse(value);
									set(result, key, parsedJson);
								} catch {
									set(result, key, value);
								}
							}
						});

						saveQueue.push(obj);
					})
					.on('error', (err) => {
						destroyStream(stream);
						reject(new InvalidPayloadException(err.message));
					})
					.on('end', () => {
						saveQueue.drain(() => {
							return resolve();
						});
					});

				saveQueue.error((err) => {
					reject(err);
				});
			});
		});
	}
}
