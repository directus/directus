import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import type { Readable, Writable } from 'node:stream';
import { useEnv } from '@directus/env';
import {
	ForbiddenError,
	InvalidPayloadError,
	InvalidQueryError,
	LimitExceededError,
	TimeoutError,
	UnsupportedMediaTypeError,
} from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type {
	AbstractServiceOptions,
	Accountability,
	ActionEventParams,
	ImportBatchCollectionResult,
	ImportBatchMode,
	ImportBatchOptions,
	ImportBatchResult,
	ImportCollectionData,
	MutationOptions,
	PrimaryKey,
	SchemaOverview,
} from '@directus/types';
import { parseJSON, toArray } from '@directus/utils';
import { createTmpFile } from '@directus/utils/node';
import { queue } from 'async';
import type { Knex } from 'knex';
import { set } from 'lodash-es';
import ms, { type StringValue } from 'ms';
import Papa from 'papaparse';
import StreamArray from 'stream-json/streamers/StreamArray.js';
import { getCache } from '../../cache.js';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import { useLogger } from '../../logger/index.js';
import { validateAccess } from '../../permissions/modules/validate-access/validate-access.js';
import { buildImportPlan } from '../../utils/build-import-plan.js';
import { createMutationTracker } from '../../utils/create-mutation-tracker.js';
import { destroyPipedStream } from '../../utils/destroy-piped-stream.js';
import { createErrorTracker } from '../../utils/error-tracker.js';
import { getService } from '../../utils/get-service.js';
import { shouldClearCache } from '../../utils/should-clear-cache.js';
import { useStore } from '../../utils/store.js';
import { transaction } from '../../utils/transaction.js';
import { userName } from '../../utils/user-name.js';
import { NotificationsService } from '../notifications.js';
import { UsersService } from '../users.js';
import { keyExists } from './key-exists.js';
import { normalizeKey } from './normalize-key.js';
import { remapForeignKeys, remapValue, resolveTarget } from './remap-foreign-keys.js';
import { validateFlatData } from './validate-flat-data.js';

const env = useEnv();
const logger = useLogger();

const store = useStore<{ importCount: number | undefined }>(String(env['IMPORT_EXPORT_NAMESPACE']), {
	ttl: ms((env['IMPORT_TIMEOUT'] as StringValue) ?? '1h'),
});

class DryRunRollback extends Error {}

export class ImportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	private async acquireImportSlot(): Promise<void> {
		const limitReached = await store(async (store) => {
			const count = (await store.get('importCount')) ?? 0;

			if (count >= Number(env['IMPORT_MAX_CONCURRENCY'])) return true;

			await store.set('importCount', count + 1);
			return false;
		});

		if (limitReached) {
			throw new LimitExceededError({
				category: 'Concurrent import',
			});
		}
	}

	private async releaseImportSlot(): Promise<void> {
		try {
			await store(async (store) => {
				const count = (await store.get('importCount')) ?? 0;
				await store.set('importCount', count - 1);
			});
		} catch (error) {
			logger.error(error, `Failed to decrement importCount`);
		}
	}

	async import(
		collection: string,
		mimetype: string,
		stream: Readable,
		options?: { background: boolean },
	): Promise<void> {
		if (this.accountability?.admin !== true && isSystemCollection(collection)) {
			throw new ForbiddenError();
		}

		if (this.accountability) {
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'create',
					collection,
				},
				{
					schema: this.schema,
					knex: this.knex,
				},
			);

			await validateAccess(
				{
					accountability: this.accountability,
					action: 'update',
					collection,
				},
				{
					schema: this.schema,
					knex: this.knex,
				},
			);
		}

		if (['application/json', 'text/csv', 'application/vnd.ms-excel'].includes(mimetype) === false) {
			throw new UnsupportedMediaTypeError({ mediaType: mimetype, where: 'file import' });
		}

		await this.acquireImportSlot();

		let promise: Promise<void>;

		if (mimetype === 'application/json') {
			promise = this.importJSON(collection, stream);
		} else {
			promise = this.importCSV(collection, stream);
		}

		if (options?.background) {
			const notify = async (subject: string, message: string) => {
				try {
					if (!this.accountability?.user) return;

					const notificationsService = new NotificationsService({
						schema: this.schema,
					});

					const usersService = new UsersService({
						schema: this.schema,
					});

					const user = await usersService.readOne(this.accountability.user, {
						fields: ['first_name', 'last_name', 'email'],
					});

					await notificationsService.createOne({
						recipient: this.accountability.user,
						sender: this.accountability.user,
						subject,
						message: `Hello ${userName(user)},\n\n${message}\n`,
					});
				} catch (error) {
					logger.error(error, `Failed to notify user`);
				}
			};

			promise
				.then(async () => {
					await notify('Your import has been successful', `Your import in ${collection} has been successful.`);
				})
				.catch(async (error) => {
					logger.error(error, `Background import to ${collection} failed`);

					await notify(
						'Your import has failed',
						`Your import in ${collection} has failed.\n\n${(error as any).message ?? ''}`,
					);
				})
				.finally(async () => await this.releaseImportSlot());
		} else {
			try {
				await promise;
			} finally {
				await this.releaseImportSlot();
			}
		}
	}

	async importJSON(collection: string, stream: Readable): Promise<void> {
		const extractJSON = StreamArray.withParser();
		const nestedActionEvents: ActionEventParams[] = [];
		const errorTracker = createErrorTracker();
		const isSingleton = this.schema.collections[collection]?.singleton ?? false;
		let timeout: NodeJS.Timeout;

		return transaction(this.knex, async (trx) => {
			const service = getService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			try {
				await new Promise<void>((resolve, reject) => {
					let rowNumber = 1;

					const saveQueue = queue(async (task: { data: Record<string, unknown>; rowNumber: number }) => {
						if (errorTracker.shouldStop()) return;

						try {
							if (isSingleton) {
								return await service.upsertSingleton(task.data, {
									bypassEmitAction: (params) => nestedActionEvents.push(params),
								});
							} else {
								return await service.upsertOne(task.data, {
									bypassEmitAction: (params) => nestedActionEvents.push(params),
								});
							}
						} catch (error) {
							for (const err of toArray(error)) {
								errorTracker.addCapturedError(err, task.rowNumber);

								if (errorTracker.shouldStop()) {
									break;
								}
							}

							if (errorTracker.shouldStop()) {
								saveQueue.kill();

								destroyPipedStream(extractJSON, stream);
								reject();
							}

							return;
						}
					});

					stream.pipe(extractJSON);

					extractJSON.on('data', ({ value }: Record<string, any>) => {
						if (isSingleton && rowNumber > 1) {
							saveQueue.kill();
							destroyPipedStream(extractJSON, stream);

							reject(
								new InvalidPayloadError({
									reason: `Cannot import multiple records into singleton collection ${collection}`,
								}),
							);

							return;
						}

						saveQueue.push({ data: value, rowNumber: rowNumber++ });
					});

					extractJSON.on('error', (err: Error) => {
						destroyPipedStream(extractJSON, stream);

						reject(new InvalidPayloadError({ reason: err.message }));
					});

					extractJSON.on('end', () => {
						// In case of empty JSON file
						if (!saveQueue.started) return resolve();

						saveQueue.drain(() => {
							if (errorTracker.hasErrors()) {
								return reject();
							}

							for (const nestedActionEvent of nestedActionEvents) {
								emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
							}

							return resolve();
						});
					});

					const duration = ms(env['IMPORT_TIMEOUT'] as StringValue);

					timeout = setTimeout(() => {
						saveQueue.kill();
						destroyPipedStream(extractJSON, stream);
						reject(new TimeoutError({ category: 'Import', duration }));
					}, duration);
				});
			} catch (error) {
				if (!error && errorTracker.hasErrors()) {
					throw errorTracker.buildFinalErrors();
				}

				throw error;
			} finally {
				clearTimeout(timeout);
			}
		});
	}

	async importCSV(collection: string, stream: Readable): Promise<void> {
		const tmpFile = await createTmpFile().catch(() => null);
		if (!tmpFile) throw new Error('Failed to create temporary file for import');

		const nestedActionEvents: ActionEventParams[] = [];
		const errorTracker = createErrorTracker();
		const isSingleton = this.schema.collections[collection]?.singleton ?? false;
		let timeout: NodeJS.Timeout;

		return transaction(this.knex, async (trx) => {
			const service = getService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			try {
				await new Promise<void>((resolve, reject) => {
					const streams: (Readable | Writable)[] = [stream];
					let rowNumber = 0;

					const cleanup = (destroy = true) => {
						if (destroy) {
							for (const stream of streams) {
								stream.destroy();
							}
						}

						tmpFile.cleanup().catch(() => {
							logger.warn(`Failed to cleanup temporary import file (${tmpFile.path})`);
						});
					};

					const saveQueue = queue(async (task: { data: Record<string, unknown>; rowNumber: number }) => {
						if (errorTracker.shouldStop()) return;

						try {
							if (isSingleton) {
								return await service.upsertSingleton(task.data, {
									bypassEmitAction: (action) => nestedActionEvents.push(action),
								});
							} else {
								return await service.upsertOne(task.data, {
									bypassEmitAction: (action) => nestedActionEvents.push(action),
								});
							}
						} catch (error: any) {
							for (const err of toArray(error)) {
								errorTracker.addCapturedError(err, task.rowNumber);

								if (errorTracker.shouldStop()) {
									break;
								}
							}

							if (errorTracker.shouldStop()) {
								saveQueue.kill();
								cleanup(true);
								reject();
							}

							return;
						}
					});

					const fileWriteStream = createWriteStream(tmpFile.path)
						.on('error', (error) => {
							cleanup();
							reject(new Error('Error while writing import data to temporary file', { cause: error }));
						})
						.on('finish', () => {
							const fileReadStream = createReadStream(tmpFile.path).on('error', (error) => {
								cleanup();
								reject(new Error('Error while reading import data from temporary file', { cause: error }));
							});

							streams.push(fileReadStream);

							fileReadStream
								.pipe(
									Papa.parse(Papa.NODE_STREAM_INPUT, {
										header: true,
										transformHeader: (header) => header.trim(),
										transform: (value: string) => {
											if (value.length === 0) return;

											try {
												const parsedJson = parseJSON(value);

												if (typeof parsedJson === 'number') {
													return value;
												}

												return parsedJson;
											} catch {
												return value;
											}
										},
									}),
								)
								.on('data', (obj: Record<string, unknown>) => {
									rowNumber++;

									if (isSingleton && rowNumber > 1) {
										saveQueue.kill();
										cleanup(true);

										reject(
											new InvalidPayloadError({
												reason: `Cannot import multiple records into singleton collection ${collection}`,
											}),
										);

										return;
									}

									const result: Record<string, unknown> = {};

									for (const field in obj) {
										if (obj[field] !== undefined) {
											set(result, field, obj[field]);
										}
									}

									saveQueue.push({ data: result, rowNumber });
								})
								.on('error', (error: Error) => {
									cleanup();
									reject(new InvalidPayloadError({ reason: error.message }));
								})
								.on('end', () => {
									// In case of empty CSV file
									if (!saveQueue.started) {
										cleanup(false);

										return resolve();
									}

									saveQueue.drain(() => {
										if (!errorTracker.shouldStop()) cleanup(false);

										if (errorTracker.hasErrors()) {
											return reject();
										}

										for (const nestedActionEvent of nestedActionEvents) {
											emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
										}

										return resolve();
									});
								});
						});

					streams.push(fileWriteStream);

					const duration = ms(env['IMPORT_TIMEOUT'] as StringValue);

					timeout = setTimeout(() => {
						saveQueue.kill();
						destroyPipedStream(fileWriteStream, stream);
						reject(new TimeoutError({ category: 'Import', duration }));
					}, duration);

					stream
						.on('error', (error) => {
							cleanup();
							reject(new Error('Error while retrieving import data', { cause: error }));
						})
						.pipe(fileWriteStream);
				});
			} catch (error) {
				if (!error && errorTracker.hasErrors()) {
					throw errorTracker.buildFinalErrors();
				}

				throw error;
			} finally {
				clearTimeout(timeout);
			}
		});
	}

	/**
	 * Import data for multiple collections in a single request. Builds a relational dependency graph
	 * from the schema, imports collections in topological order, remaps primary keys (and the foreign
	 * keys that reference them), and resolves nullable relational cycles via a second pass.
	 */
	async importBatch(input: ImportCollectionData[], options: ImportBatchOptions = {}): Promise<ImportBatchResult> {
		const mode: ImportBatchMode = options.mode ?? 'add';
		const dryRun = options.dryRun ?? false;
		const dangerouslyAllowDelete = options.dangerouslyAllowDelete ?? false;

		if (dangerouslyAllowDelete && mode !== 'merge') {
			throw new InvalidQueryError({
				reason: `"dangerouslyAllowDelete" can only be used with mode "merge"`,
			});
		}

		const plan = buildImportPlan(input, this.schema);

		const dataByCollection = new Map<string, ImportCollectionData>();

		for (const entry of input) {
			dataByCollection.set(entry.collection, entry);
		}

		const collections: Record<string, ImportBatchCollectionResult> = {};
		// String(oldPk) -> new primary key, per collection
		const idMaps = new Map<string, Map<string, PrimaryKey>>();

		// Permission checks + system collection guard (mirrors this.import)
		for (const collection of plan.order) {
			collections[collection] = { existing: [], new: [], deleted: [], mapped: {} };
			idMaps.set(collection, new Map());

			if (this.accountability?.admin !== true && isSystemCollection(collection)) {
				throw new ForbiddenError();
			}

			if (this.accountability) {
				await validateAccess(
					{ accountability: this.accountability, action: 'create', collection },
					{ schema: this.schema, knex: this.knex },
				);

				const hasRemappableAlias = plan.aliasFields.get(collection)!.some((info) => info.target !== null);
				const isSingleton = this.schema.collections[collection]?.singleton ?? false;

				if (mode === 'merge' || isSingleton || plan.deferred.has(collection) || hasRemappableAlias) {
					await validateAccess(
						{ accountability: this.accountability, action: 'update', collection },
						{ schema: this.schema, knex: this.knex },
					);
				}

				if (dangerouslyAllowDelete) {
					await validateAccess(
						{ accountability: this.accountability, action: 'delete', collection },
						{ schema: this.schema, knex: this.knex },
					);
				}
			}
		}

		// Reject nested relational payloads before touching the database
		validateFlatData(plan.fkFields, plan.aliasFields, dataByCollection);

		const nestedActionEvents: ActionEventParams[] = [];

		await this.acquireImportSlot();

		try {
			await transaction(this.knex, async (trx) => {
				const mutationTracker = createMutationTracker();

				const mutationOptions: MutationOptions = {
					bypassEmitAction: (params) => nestedActionEvents.push(params),
					mutationTracker,
					autoPurgeCache: false,
					autoPurgeSystemCache: false,
				};

				// Pass 1: insert/upsert each collection in dependency order, remapping FKs and PKs
				for (const collection of plan.order) {
					const entry = dataByCollection.get(collection)!;
					const idMap = idMaps.get(collection)!;
					const fkFields = plan.fkFields.get(collection)!;

					// Fields resolved in the second pass. deferred FKs + remappable o2m/m2m aliases
					const secondPassFields = new Set<string>(plan.deferred.get(collection));

					for (const info of plan.aliasFields.get(collection) ?? []) {
						if (info.target !== null) secondPassFields.add(info.field);
					}

					const service = getService(collection, {
						knex: trx,
						schema: this.schema,
						accountability: this.accountability,
					});

					const { primary: pkField, fields, singleton: isSingleton } = this.schema.collections[collection]!;
					const pkOverview = fields[pkField]!;

					const isAutoIncrement =
						['integer', 'bigInteger'].includes(pkOverview.type) && pkOverview.defaultValue === 'AUTO_INCREMENT';

					const isUuid = pkOverview.type === 'uuid';

					if (isSingleton && entry.items.length > 1) {
						throw new InvalidPayloadError({
							reason: `Cannot import multiple records into singleton collection "${collection}"`,
						});
					}

					for (const item of entry.items) {
						const payload = remapForeignKeys(item, fkFields, idMaps, secondPassFields);
						const oldPk = item[pkField] as PrimaryKey | undefined;

						let newPk: PrimaryKey;
						let matchedExisting = false;

						if (isSingleton) {
							// ignore the PK if provided and manually do an upsertSingleton so we know if it was created or updated
							delete payload[pkField];

							const existingRow = await trx.select(pkField).from(collection).first();

							if (existingRow) {
								matchedExisting = true;
								newPk = await service.updateOne(existingRow[pkField], payload, mutationOptions);
							} else {
								newPk = await service.createOne(payload, mutationOptions);
							}
						} else if (mode === 'merge') {
							matchedExisting = oldPk != null && (await keyExists(trx, collection, pkField, oldPk));

							if (!matchedExisting && isAutoIncrement) {
								// Key doesn't exist: remap so the auto-increment sequence keeps advancing naturally
								delete payload[pkField];
							}

							newPk = await service.upsertOne(payload, mutationOptions);
						} else if (isAutoIncrement) {
							// Add mode: always remap so the sequence keeps advancing naturally
							delete payload[pkField];
							newPk = await service.createOne(payload, mutationOptions);
						} else {
							const conflict = oldPk != null && (await keyExists(trx, collection, pkField, oldPk));

							if (conflict) {
								if (isUuid) {
									payload[pkField] = randomUUID();
								} else {
									throw new InvalidPayloadError({
										reason: `Item with primary key "${oldPk}" in "${collection}" conflicts with an existing record and can't be safely remapped (only uuid keys are regenerated)`,
									});
								}
							}

							newPk = await service.createOne(payload, mutationOptions);
						}

						const result = collections[collection]!;

						if (matchedExisting) {
							result.existing.push(newPk);
						} else {
							result.new.push(newPk);
						}

						if (oldPk != null) {
							idMap.set(String(oldPk), newPk);

							if (!isSingleton && normalizeKey(oldPk) !== normalizeKey(newPk)) {
								result.mapped[String(oldPk)] = newPk;
							}
						}
					}
				}

				// Pass 2: resolve fields deferred to break nullable cycles and remap o2m/m2m alias arrays,
				// now that every collection has been imported and all id maps are complete
				for (const collection of plan.order) {
					const deferredFields = plan.deferred.get(collection);
					const aliasFields = plan.aliasFields.get(collection)?.filter((info) => info.target !== null) ?? [];

					if (!deferredFields && aliasFields.length === 0) continue;

					const entry = dataByCollection.get(collection)!;
					const idMap = idMaps.get(collection)!;
					const fkFields = plan.fkFields.get(collection)!;
					const { primary: pkField } = this.schema.collections[collection]!;

					const service = getService(collection, {
						knex: trx,
						schema: this.schema,
						accountability: this.accountability,
					});

					for (const item of entry.items) {
						const oldPk = item[pkField] as PrimaryKey | undefined;
						if (oldPk == null) continue;

						const newPk = idMap.get(String(oldPk));
						if (newPk === undefined) continue;

						const patch: Record<string, unknown> = {};

						if (deferredFields) {
							for (const field of deferredFields) {
								const rawValue = item[field];
								if (rawValue === undefined || rawValue === null) continue;

								const fkInfo = fkFields.find((info) => info.field === field)!;
								patch[field] = remapValue(rawValue, resolveTarget(fkInfo, item), idMaps);
							}
						}

						for (const info of aliasFields) {
							const rawValue = item[info.field];
							if (rawValue === undefined || rawValue === null) continue;

							patch[info.field] = remapValue(rawValue, info.target, idMaps);
						}

						if (Object.keys(patch).length === 0) continue;

						await service.updateOne(newPk, patch, mutationOptions);
					}
				}

				// Destructive mirror: delete every existing record whose primary key survived neither an
				// insert nor a merge. Reverse dependency order so children go before the parents they
				// reference, avoiding foreign key violations.
				if (dangerouslyAllowDelete) {
					for (const collection of [...plan.order].reverse()) {
						const result = collections[collection]!;
						const importKeys = [...result.existing, ...result.new];
						const { primary: pkField } = this.schema.collections[collection]!;

						const service = getService(collection, {
							knex: trx,
							schema: this.schema,
							accountability: this.accountability,
						});

						result.deleted = await service.deleteByQuery(
							{
								filter: importKeys.length > 0 ? { [pkField]: { _nin: importKeys } } : {},
								limit: -1,
							},
							mutationOptions,
						);
					}
				}

				if (dryRun) throw new DryRunRollback();
			});

			// Only emit action events and purge the cache once the data is actually committed
			for (const nestedActionEvent of nestedActionEvents) {
				emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
			}

			const { cache } = getCache();
			if (shouldClearCache(cache)) await cache.clear();

			return { applied: true, mode, collections };
		} catch (error) {
			if (error instanceof DryRunRollback) {
				return { applied: false, mode, collections };
			}

			throw error;
		} finally {
			await this.releaseImportSlot();
		}
	}
}
