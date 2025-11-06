import { useEnv } from '@directus/env';
import {
	createError,
	ErrorCode,
	ForbiddenError,
	InvalidPayloadError,
	ServiceUnavailableError,
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
import { parseJSON, toArray } from '@directus/utils';
import { createTmpFile } from '@directus/utils/node';
import { queue } from 'async';
import destroyStream from 'destroy';
import { dump as toYAML } from 'js-yaml';
import { parse as toXML } from 'js2xmlparser';
import { Parser as CSVParser, transforms as CSVTransforms } from 'json2csv';
import type { Knex } from 'knex';
import { createReadStream, createWriteStream } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import type { Readable, Stream } from 'node:stream';
import Papa from 'papaparse';
import StreamArray from 'stream-json/streamers/StreamArray.js';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import type { FunctionFieldNode, FieldNode, NestedCollectionNode } from '../types/index.js';
import { getDateFormatted } from '../utils/get-date-formatted.js';
import { getService } from '../utils/get-service.js';
import { transaction } from '../utils/transaction.js';
import { Url } from '../utils/url.js';
import { userName } from '../utils/user-name.js';
import { FilesService } from './files.js';
import { NotificationsService } from './notifications.js';
import { UsersService } from './users.js';
import { parseFields } from '../database/get-ast-from-query/lib/parse-fields.js';
import { set } from 'lodash-es';
import type { ImportRowLines, ImportRowRange } from '@directus/validation';

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

export class ImportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async import(collection: string, mimetype: string, stream: Readable): Promise<void> {
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

		switch (mimetype) {
			case 'application/json':
				return await this.importJSON(collection, stream);
			case 'text/csv':
			case 'application/vnd.ms-excel':
				return await this.importCSV(collection, stream);
			default:
				throw new UnsupportedMediaTypeError({ mediaType: mimetype, where: 'file import' });
		}
	}

	async importJSON(collection: string, stream: Readable): Promise<void> {
		const extractJSON = StreamArray.withParser();
		const nestedActionEvents: ActionEventParams[] = [];
		const errorTracker = createErrorTracker();

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
							const result = await service.upsertOne(task.data, {
								bypassEmitAction: (params) => nestedActionEvents.push(params),
							});

							return result;
						} catch (error) {
							for (const err of toArray(error)) {
								errorTracker.addCapturedError(err, task.rowNumber);

								if (errorTracker.shouldStop()) {
									break;
								}
							}

							if (errorTracker.shouldStop()) {
								saveQueue.kill();
								destroyStream(stream);
								destroyStream(extractJSON);
								reject();
							}

							return;
						}
					});

					stream.pipe(extractJSON);

					extractJSON.on('data', ({ value }: Record<string, any>) => {
						saveQueue.push({ data: value, rowNumber: rowNumber++ });
					});

					extractJSON.on('error', (err: Error) => {
						destroyStream(stream);
						destroyStream(extractJSON);

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
				});
			} catch (error) {
				if (!error && errorTracker.hasErrors()) {
					throw errorTracker.buildFinalErrors();
				}

				throw error;
			}
		});
	}

	async importCSV(collection: string, stream: Readable): Promise<void> {
		const tmpFile = await createTmpFile().catch(() => null);
		if (!tmpFile) throw new Error('Failed to create temporary file for import');

		const nestedActionEvents: ActionEventParams[] = [];
		const errorTracker = createErrorTracker();

		return transaction(this.knex, async (trx) => {
			const service = getService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			try {
				await new Promise<void>((resolve, reject) => {
					const streams: Stream[] = [stream];
					let rowNumber = 0;

					const cleanup = (destroy = true) => {
						if (destroy) {
							for (const stream of streams) {
								destroyStream(stream);
							}
						}

						tmpFile.cleanup().catch(() => {
							logger.warn(`Failed to cleanup temporary import file (${tmpFile.path})`);
						});
					};

					const saveQueue = queue(async (task: { data: Record<string, unknown>; rowNumber: number }) => {
						if (errorTracker.shouldStop()) return;

						try {
							const result = await service.upsertOne(task.data, {
								bypassEmitAction: (action) => nestedActionEvents.push(action),
							});

							return result;
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
			}
		});
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

						if (format === 'csv') {
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

			const storage: string = toArray(env['STORAGE_LOCATIONS'] as string)[0]!;

			const title = `export-${collection}-${getDateFormatted()}`;
			const filename = `${title}.${format}`;

			const fileWithDefaults: Partial<File> & { storage: string; filename_download: string } = {
				...(options?.file ?? {}),
				title: options?.file?.title ?? title,
				filename_download: options?.file?.filename_download ?? filename,
				storage: options?.file?.storage ?? storage,
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

		if (format === 'csv') {
			if (input.length === 0) return '';

			const transforms = [CSVTransforms.flatten({ separator: '.' })];
			const header = options?.includeHeader !== false;

			const transformOptions = options?.fields
				? { transforms, header, fields: options?.fields, withBOM: header }
				: { transforms, header, withBOM: header };

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
