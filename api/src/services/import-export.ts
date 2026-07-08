import { createReadStream, createWriteStream } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import { type Readable, Transform, type Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { useEnv } from '@directus/env';
import {
	ContentTooLargeError,
	createError,
	ErrorCode,
	ForbiddenError,
	InvalidPayloadError,
	LimitExceededError,
	ServiceUnavailableError,
	TimeoutError,
	UnsupportedMediaTypeError,
} from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type {
	AbstractServiceOptions,
	Accountability,
	ActionEventParams,
	DirectusError,
	ExportFormat,
	File,
	Query,
	SchemaOverview,
} from '@directus/types';
import { getDateTimeFormatted, parseJSON, toArray } from '@directus/utils';
import { createTmpFile } from '@directus/utils/node';
import type { ImportRowLines, ImportRowRange } from '@directus/validation';
import { queue } from 'async';
import bytes from 'bytes';
import { dump as toYAML } from 'js-yaml';
import { parse as toXML } from 'js2xmlparser';
import { Parser as CSVParser, transforms as CSVTransforms } from 'json2csv';
import type { Knex } from 'knex';
import { set } from 'lodash-es';
import ms, { type StringValue } from 'ms';
import Papa from 'papaparse';
import StreamArray from 'stream-json/streamers/StreamArray.js';
import { parseFields } from '../database/get-ast-from-query/lib/parse-fields.js';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../types/index.js';
import { destroyPipedStream } from '../utils/destroy-piped-stream.js';
import { getService } from '../utils/get-service.js';
import { useStore } from '../utils/store.js';
import { transaction } from '../utils/transaction.js';
import { Url } from '../utils/url.js';
import { userName } from '../utils/user-name.js';
import { FilesService } from './files.js';
import { NotificationsService } from './notifications.js';
import { UsersService } from './users.js';

const env = useEnv();
const logger = useLogger();

const MAX_IMPORT_ERRORS = env['MAX_IMPORT_ERRORS'] as number;

type CapturedErrorData = {
	message: string;
	rowNumbers: number[];
};

export function createErrorTracker() {
	let genericError: DirectusError | undefined;
	// For errors with field / type (joi validation or DB with field)
	const fieldErrors: Map<ErrorCode, Map<string, CapturedErrorData>> = new Map();
	let capturedErrorCount = 0;
	let isLimitReached = false;

	function convertToRanges(rows: number[], minRangeSize = 4): Array<ImportRowLines | ImportRowRange> {
		const sorted = Array.from(new Set(rows)).sort((a, b) => a - b);
		const result: Array<ImportRowLines | ImportRowRange> = [];

		if (sorted.length === 0) return [];

		let start = sorted[0] as number;
		let prev = sorted[0] as number;
		let count = 1;
		const nonConsecutive: number[] = [];

		const flush = () => {
			if (count >= minRangeSize) {
				result.push({ type: 'range', start, end: prev });
			} else {
				for (let i = start; i <= prev; i++) {
					nonConsecutive.push(i);
				}
			}
		};

		for (let i = 1; i < sorted.length; i++) {
			const current = sorted[i] as number;

			if (current === prev + 1) {
				prev = current;
				count++;
			} else {
				flush();
				start = prev = current;
				count = 1;
			}
		}

		flush();

		// Add non-consecutive rows as a single "lines" entry
		if (nonConsecutive.length > 0) {
			result.push({ type: 'lines', rows: nonConsecutive });
		}

		return result;
	}

	function addCapturedError(err: any, rowNumber: number) {
		const field = err.extensions?.field;

		if (field) {
			const type = err.extensions?.type;
			const substring = err.extensions?.substring;
			const valid = err.extensions?.valid;
			const invalid = err.extensions?.invalid;
			let key = type ? `${field}|${type}` : field;

			if (substring !== undefined) key += `|substring:${substring}`;
			if (valid !== undefined) key += `|valid:${JSON.stringify(valid)}`;
			if (invalid !== undefined) key += `|invalid:${JSON.stringify(invalid)}`;

			if (!fieldErrors.has(err.code)) {
				fieldErrors.set(err.code, new Map());
			}

			const errorsByCode = fieldErrors.get(err.code)!;

			if (!errorsByCode.has(key)) {
				errorsByCode.set(key, {
					message: err.message,
					rowNumbers: [],
				});
			}

			errorsByCode.get(key)!.rowNumbers.push(rowNumber);
		} else {
			genericError = err;
		}

		capturedErrorCount++;

		if (capturedErrorCount >= MAX_IMPORT_ERRORS) {
			isLimitReached = true;
		}
	}

	function hasGenericError() {
		return genericError !== undefined;
	}

	function buildFinalErrors() {
		if (genericError) {
			return [genericError];
		}

		return Array.from(fieldErrors.entries()).flatMap(([code, fieldMap]) =>
			Array.from(fieldMap.entries()).map(([compositeKey, errorData]) => {
				const parts = compositeKey.split('|');
				const field = parts[0];
				const type = parts[1];

				const extensions: any = {};

				for (let i = 2; i < parts.length; i++) {
					const [paramType, paramValue] = parts[i]?.split(':', 2) ?? [];
					if (!paramType || paramValue === undefined) continue;

					try {
						extensions[paramType] = JSON.parse(paramValue);
					} catch {
						extensions[paramType] = paramValue;
					}
				}

				const ErrorClass = createError<any>(code, errorData.message, 400);
				return new ErrorClass({
					field,
					type,
					...extensions,
					rows: convertToRanges(errorData.rowNumbers),
				});
			}),
		);
	}

	return {
		addCapturedError,
		buildFinalErrors,
		getCount: () => capturedErrorCount,
		hasErrors: () => capturedErrorCount > 0 || hasGenericError(),
		shouldStop: () => isLimitReached || hasGenericError(),
		hasGenericError,
	};
}

const store = useStore<{ importCount: number | undefined }>(String(env['IMPORT_EXPORT_NAMESPACE']), {
	ttl: ms((env['IMPORT_TIMEOUT'] as StringValue) ?? '1h'),
});

type TmpFile = Awaited<ReturnType<typeof createTmpFile>>;

export class ImportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async import(
		collection: string,
		mimetype: string,
		stream: Readable,
		options?: { background: boolean },
	): Promise<void> {
		if (this.accountability?.admin !== true && isSystemCollection(collection)) throw new ForbiddenError();

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

		let promise: Promise<void>;

		const decrementImportCount = async () => {
			try {
				await store(async (store) => {
					const count = (await store.get('importCount')) ?? 0;
					await store.set('importCount', count - 1);
				});
			} catch (error) {
				logger.error(error, `Failed to decrement importCount`);
			}
		};

		if (options?.background) {
			// Fully receive the upload (to a temp file) before responding, so the detached parse job reads
			// the spooled copy instead of the live request body.
			let tmpFile: TmpFile;

			try {
				tmpFile = await this.spoolToTmpFile(stream);
			} catch (error) {
				await decrementImportCount();
				throw error;
			}

			if (mimetype === 'application/json') {
				// importJSON doesn't own the temp file, so clean it up here.
				promise = this.importJSON(collection, createReadStream(tmpFile.path)).finally(() =>
					tmpFile.cleanup().catch(() => {
						logger.warn(`Failed to cleanup temporary import file (${tmpFile.path})`);
					}),
				);
			} else {
				// parseCsvFromTmpFile owns and cleans up the spooled file itself.
				promise = this.parseCsvFromTmpFile(collection, tmpFile);
			}
		} else if (mimetype === 'application/json') {
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
				.finally(async () => await decrementImportCount());
		} else {
			try {
				await promise;
			} finally {
				await decrementImportCount();
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

					// Without a source-stream error handler a read failure would go unhandled and the
					// import promise would never settle.
					stream.on('error', (error: Error) => {
						saveQueue.kill();
						destroyPipedStream(extractJSON, stream);
						reject(new Error('Error while retrieving import data', { cause: error }));
					});

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

	/**
	 * Spool a source stream to a fresh temp file, resolving only once the whole stream has been
	 * received. Used to fully consume the request body within the request lifecycle before a
	 * background import detaches (see the background branch in `import()`).
	 */
	private async spoolToTmpFile(stream: Readable): Promise<TmpFile> {
		const tmpFile = await createTmpFile().catch(() => null);
		if (!tmpFile) throw new Error('Failed to create temporary file for import');

		// Bound the receive phase by IMPORT_TIMEOUT so a stalled upload can't hang indefinitely.
		const duration = ms(env['IMPORT_TIMEOUT'] as StringValue);
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), duration);

		// Cap the spooled file size to stop an unbounded upload filling the disk (unset means unlimited).
		const maxFileSize = bytes.parse(env['IMPORT_MAX_FILE_SIZE'] as string) ?? undefined;
		let bytesReceived = 0;
		let limitExceeded = false;

		const limiter = new Transform({
			transform(chunk: Buffer, _encoding, callback) {
				bytesReceived += chunk.length;

				if (maxFileSize !== undefined && bytesReceived > maxFileSize) {
					limitExceeded = true;
					callback(new Error('Import file exceeds IMPORT_MAX_FILE_SIZE'));
					return;
				}

				callback(null, chunk);
			},
		});

		try {
			await pipeline(stream, limiter, createWriteStream(tmpFile.path), { signal: controller.signal });
		} catch (error) {
			await tmpFile.cleanup().catch(() => {
				logger.warn(`Failed to cleanup temporary import file (${tmpFile.path})`);
			});

			if (limitExceeded) {
				throw new ContentTooLargeError();
			}

			if (controller.signal.aborted) {
				throw new TimeoutError({ category: 'Import', duration });
			}

			throw new Error('Error while retrieving import data', { cause: error });
		} finally {
			clearTimeout(timeout);
		}

		return tmpFile;
	}

	async importCSV(collection: string, stream: Readable): Promise<void> {
		const tmpFile = await this.spoolToTmpFile(stream);
		return this.parseCsvFromTmpFile(collection, tmpFile);
	}

	/**
	 * Parse an already-spooled CSV temp file and upsert its rows. Owns the lifecycle of the passed
	 * temp file and cleans it up when done.
	 */
	private async parseCsvFromTmpFile(collection: string, tmpFile: TmpFile): Promise<void> {
		const nestedActionEvents: ActionEventParams[] = [];
		const errorTracker = createErrorTracker();
		const isSingleton = this.schema.collections[collection]?.singleton ?? false;
		let timeout: NodeJS.Timeout;

		// Remove the spooled file exactly once (the parse cleanup below, or the trailing .finally which
		// also covers failures before the parse Promise is reached).
		let removed = false;

		const removeTmpFile = () => {
			if (removed) return;
			removed = true;

			tmpFile.cleanup().catch(() => {
				logger.warn(`Failed to cleanup temporary import file (${tmpFile.path})`);
			});
		};

		return transaction(this.knex, async (trx) => {
			const service = getService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			try {
				await new Promise<void>((resolve, reject) => {
					const streams: (Readable | Writable)[] = [];
					let rowNumber = 0;

					const cleanup = (destroy = true) => {
						if (destroy) {
							for (const stream of streams) {
								stream.destroy();
							}
						}

						removeTmpFile();
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

					const fileReadStream = createReadStream(tmpFile.path).on('error', (error) => {
						cleanup();
						reject(new Error('Error while reading import data from temporary file', { cause: error }));
					});

					streams.push(fileReadStream);

					const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, {
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
					});

					fileReadStream
						.pipe(parseStream)
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

					const duration = ms(env['IMPORT_TIMEOUT'] as StringValue);

					timeout = setTimeout(() => {
						saveQueue.kill();
						destroyPipedStream(parseStream, fileReadStream);
						// Destroying via destroyPipedStream skips cleanup(), so remove the spooled file here.
						cleanup(true);
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
		}).finally(() => removeTmpFile());
	}
}

export class ExportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	/**
	 * Export the query results as a named file. Will query in batches, and keep appending a tmp file
	 * until all the data is retrieved. Uploads the result as a new file using the regular
	 * FilesService upload method.
	 */
	async exportToFile(
		collection: string,
		query: Partial<Query>,
		format: ExportFormat,
		options?: {
			file?: Partial<File>;
		},
	) {
		const { createTmpFile } = await import('@directus/utils/node');
		const tmpFile = await createTmpFile().catch(() => null);

		try {
			if (!tmpFile) throw new Error('Failed to create temporary file for export');

			const mimeTypes = {
				csv: 'text/csv',
				csv_utf8: 'text/csv; charset=utf-8',
				json: 'application/json',
				xml: 'text/xml',
				yaml: 'text/yaml',
			};

			const database = getDatabase();

			await transaction(database, async (trx) => {
				const service = getService(collection, {
					accountability: this.accountability,
					schema: this.schema,
					knex: trx,
				});

				const { primary } = this.schema.collections[collection]!;

				const sort = query.sort ?? [];

				if (sort.includes(primary) === false) {
					sort.push(primary);
				}

				const totalCount = await service
					.readByQuery({
						...query,
						aggregate: {
							count: ['*'],
						},
					})
					.then((result) => Number(result?.[0]?.['count'] ?? 0));

				const count = query.limit && query.limit > -1 ? Math.min(totalCount, query.limit) : totalCount;

				const requestedLimit = query.limit ?? -1;
				const batchesRequired = Math.ceil(count / (env['EXPORT_BATCH_SIZE'] as number));

				let readCount = 0;

				for (let batch = 0; batch < batchesRequired; batch++) {
					let limit = env['EXPORT_BATCH_SIZE'] as number;

					if (requestedLimit > 0 && (env['EXPORT_BATCH_SIZE'] as number) > requestedLimit - readCount) {
						limit = requestedLimit - readCount;
					}

					const result = await service.readByQuery({
						...query,
						sort,
						limit,
						offset: batch * (env['EXPORT_BATCH_SIZE'] as number),
					});

					readCount += result.length;

					if (result.length) {
						let csvHeadings = null;

						if (format.startsWith('csv')) {
							if (!query.fields) query.fields = ['*'];

							// to ensure the all headings are included in the CSV file, all possible fields need to be determined.

							const parsedFields = await parseFields(
								{
									parentCollection: collection,
									fields: query.fields,
									query: query,
									accountability: this.accountability,
								},
								{
									schema: this.schema,
									knex: database,
								},
							);

							csvHeadings = getHeadingsForCsvExport(parsedFields);
						}

						await appendFile(
							tmpFile.path,
							this.transform(result, format, {
								includeHeader: batch === 0,
								includeFooter: batch + 1 === batchesRequired,
								fields: csvHeadings,
							}),
						);
					}
				}
			});

			const filesService = new FilesService({
				accountability: this.accountability,
				schema: this.schema,
			});

			const title = `export-${collection}-${getDateTimeFormatted()}`;
			const filename = `${title}.${format}`;

			const fileWithDefaults: Partial<File> & { filename_download: string } = {
				...(options?.file ?? {}),
				title: options?.file?.title ?? title,
				filename_download: options?.file?.filename_download ?? filename,
				type: mimeTypes[format],
			};

			const savedFile = await filesService.uploadOne(createReadStream(tmpFile.path), fileWithDefaults);

			if (this.accountability?.user) {
				const notificationsService = new NotificationsService({
					schema: this.schema,
				});

				const usersService = new UsersService({
					schema: this.schema,
				});

				const user = await usersService.readOne(this.accountability.user, {
					fields: ['first_name', 'last_name', 'email'],
				});

				const href = new Url(env['PUBLIC_URL'] as string).addPath('admin', 'files', savedFile).toString();

				const message = `
Hello ${userName(user)},

Your export of ${collection} is ready. <a href="${href}">Click here to view.</a>
`;

				await notificationsService.createOne({
					recipient: this.accountability.user,
					sender: this.accountability.user,
					subject: `Your export of ${collection} is ready`,
					message,
					collection: `directus_files`,
					item: savedFile,
				});
			}
		} catch (err: any) {
			logger.error(err, `Couldn't export ${collection}: ${err.message}`);

			if (this.accountability?.user) {
				const notificationsService = new NotificationsService({
					schema: this.schema,
				});

				await notificationsService.createOne({
					recipient: this.accountability.user,
					sender: this.accountability.user,
					subject: `Your export of ${collection} failed`,
					message: `Please contact your system administrator for more information.`,
				});
			}
		} finally {
			await tmpFile?.cleanup();
		}
	}

	/**
	 * Transform a given input object / array to the given type
	 */
	transform(
		input: Record<string, any>[],
		format: ExportFormat,
		options?: {
			includeHeader?: boolean;
			includeFooter?: boolean;
			fields?: string[] | null;
		},
	): string {
		if (format === 'json') {
			let string = JSON.stringify(input || null, null, '\t');

			if (options?.includeHeader === false) string = string.split('\n').slice(1).join('\n');

			if (options?.includeFooter === false) {
				const lines = string.split('\n');
				string = lines.slice(0, lines.length - 1).join('\n');
				string += ',\n';
			}

			return string;
		}

		if (format === 'xml') {
			let string = toXML('data', input);

			if (options?.includeHeader === false) string = string.split('\n').slice(2).join('\n');

			if (options?.includeFooter === false) {
				const lines = string.split('\n');
				string = lines.slice(0, lines.length - 1).join('\n');
				string += '\n';
			}

			return string;
		}

		if (format.startsWith('csv')) {
			if (input.length === 0) return '';

			const transforms = [CSVTransforms.flatten({ separator: '.' })];
			const header = options?.includeHeader !== false;
			const withBOM = format === 'csv_utf8';

			const transformOptions = options?.fields
				? { transforms, header, fields: options?.fields, withBOM }
				: { transforms, header, withBOM };

			let string = new CSVParser(transformOptions).parse(input);

			if (options?.includeHeader === false) {
				string = '\n' + string;
			}

			return string;
		}

		if (format === 'yaml') {
			return toYAML(input);
		}

		throw new ServiceUnavailableError({ service: 'export', reason: `Illegal export type used: "${format}"` });
	}
}
/*
 * Recursive function to traverse the field nodes, to determine the headings for the CSV export file.
 *
 * Relational nodes which target a single item get expanded, which means that their nested fields get their own column in the csv file.
 * For relational nodes which target a multiple items, the nested field names are not going to be expanded.
 * Instead they will be stored as a single value/cell of the CSV file.
 */
export function getHeadingsForCsvExport(
	nodes: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] | undefined,
	prefix: string = '',
) {
	let fieldNames: string[] = [];

	if (!nodes) return fieldNames;

	nodes.forEach((node) => {
		switch (node.type) {
			case 'field':
			case 'functionField':
			case 'o2m':
			case 'a2o':
				fieldNames.push(prefix ? `${prefix}.${node.fieldKey}` : node.fieldKey);
				break;
			case 'm2o':
				fieldNames = fieldNames.concat(
					getHeadingsForCsvExport(node.children, prefix ? `${prefix}.${node.fieldKey}` : node.fieldKey),
				);
		}
	});

	return fieldNames;
}
