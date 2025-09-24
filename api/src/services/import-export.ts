import { useEnv } from '@directus/env';
import {
	ErrorCode,
	ForbiddenError,
	InvalidImportError,
	InvalidPayloadError,
	ServiceUnavailableError,
	UnsupportedMediaTypeError,
} from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type {
	AbstractServiceOptions,
	Accountability,
	ActionEventParams,
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
import { getDatabaseValidationType } from '../utils/get-database-validation-type.js';
import { FilesService } from './files.js';
import { NotificationsService } from './notifications.js';
import { UsersService } from './users.js';
import { parseFields } from '../database/get-ast-from-query/lib/parse-fields.js';
import { set } from 'lodash-es';
import type { Readable as NodeReadable } from 'node:stream';

const env = useEnv();
const logger = useLogger();

const MAX_IMPORT_ERRORS = 1000; // Maximum individual errors to collect before stopping
const MAX_DISPLAY_ERRORS = 50; // Maximum error groups to return in API response

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

		return transaction(this.knex, (trx) => {
			const service = getService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			const saveQueue = queue(async (value: Record<string, unknown>) => {
				return await service.upsertOne(value, { bypassEmitAction: (params) => nestedActionEvents.push(params) });
			});

			return new Promise<void>((resolve, reject) => {
				stream.pipe(extractJSON);

				extractJSON.on('data', ({ value }: Record<string, any>) => {
					saveQueue.push(value);
				});

				extractJSON.on('error', (err: Error) => {
					destroyStream(stream);
					destroyStream(extractJSON);

					reject(new InvalidPayloadError({ reason: err.message }));
				});

				saveQueue.error((err) => {
					reject(err);
				});

				extractJSON.on('end', () => {
					saveQueue.drain(() => {
						for (const nestedActionEvent of nestedActionEvents) {
							emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
						}

						return resolve();
					});
				});
			});
		});
	}

	async importCSV(collection: string, stream: Readable): Promise<void> {
		const tmpFile = await createTmpFile().catch(() => null);
		if (!tmpFile) throw new Error('Failed to create temporary file for import');

		const nestedActionEvents: ActionEventParams[] = [];

		let csvReadStream: NodeReadable | null = null;
		let hasReachedErrorLimit = false;

		// Structured, machine-readable errors to return in error.extensions
		const structuredRows: Array<{
			row: number;
			code?: string;
			field?: string | null;
			value?: unknown;
			reason: string;
			type: string;
		}> = [];

		return transaction(this.knex, async (trx) => {
			const service = getService(collection, {
				knex: trx,
				schema: this.schema,
				accountability: this.accountability,
			});

			const saveQueue = queue(async (task: { data: Record<string, unknown>; rowNumber: number }) => {
				// Skip processing if we've already reached the error limit
				if (hasReachedErrorLimit) return null;

				try {
					const result = await service.upsertOne(task.data, {
						bypassEmitAction: (action) => nestedActionEvents.push(action),
					});

					return result;
				} catch (error: any) {
					const processError = async (err: any): Promise<void> => {
						const field: string | null = err.extensions?.field ?? null;
						let customMessage = err.message || 'Validation error';

						if (field) {
							try {
								const fieldMeta = await trx
									.select('validation_message')
									.from('directus_fields')
									.where({ collection, field })
									.first();

								if (fieldMeta?.validation_message) {
									customMessage = fieldMeta.validation_message;
								}
							} catch (dbError) {
								logger.warn(
									`Failed to fetch validation_message for field ${collection}.${field}: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
								);
							}
						}

						structuredRows.push({
							row: task.rowNumber,
							code: err.code,
							field: field ?? null,
							value: field ? task.data[field] : undefined,
							reason: customMessage,
							type: getDatabaseValidationType(err.code, err.extensions),
						});

						// Stop processing if too many errors to avoid memory/payload issues
						if (structuredRows.length >= MAX_IMPORT_ERRORS && !hasReachedErrorLimit) {
							hasReachedErrorLimit = true;
							if (csvReadStream) csvReadStream.destroy();
						}
					};

					// Process single error or array of errors
					const errors = Array.isArray(error) ? error : [error];

					for (const err of errors) {
						await processError(err);
					}

					return null;
				}
			});

			const transform = (value: string, _field?: string | number) => {
				if (value.length === 0) return undefined;

				try {
					const parsedJson = parseJSON(value);

					if (typeof parsedJson === 'number') {
						return value;
					}

					return parsedJson;
				} catch {
					return value;
				}
			};

			const PapaOptions: Papa.ParseConfig = {
				header: true,
				skipEmptyLines: true,
				// Trim whitespaces in headers, including the byte order mark (BOM) zero-width no-break space
				transformHeader: (header) => header.trim(),
				transform,
			};

			return new Promise<void>((resolve, reject) => {
				const streams: Stream[] = [stream];
				let rowNumber = 1;

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

				// Function to group similar errors for better UX and smaller payload
				const groupSimilarErrors = (
					errors: Array<{
						row: number;
						code?: string;
						field?: string | null;
						value?: unknown;
						reason: string;
						type: string;
					}>,
				) => {
					const groups = new Map<
						string,
						{
							rows: number[];
							code?: string;
							field?: string | null;
							reason: string;
							type: string;
							sampleValue?: unknown;
						}
					>();

					// Group errors by field + reason + code
					errors.forEach((error) => {
						const key = `${error.field || 'unknown'}|${error.reason}|${error.code}`;

						if (!groups.has(key)) {
							groups.set(key, {
								rows: [],
								code: error.code || ErrorCode.FailedValidation,
								field: error.field || null,
								reason: error.reason,
								type: error.type,
								sampleValue: error.value,
							});
						}

						groups.get(key)!.rows.push(error.row);
					});

					// Convert groups to final format with row ranges
					return Array.from(groups.values()).map((group) => {
						const sortedRows = group.rows.sort((a, b) => a - b);

						const ranges: string[] = [];
						let start = sortedRows[0]!;
						let end = sortedRows[0]!;

						for (let i = 1; i < sortedRows.length; i++) {
							if (sortedRows[i]! === end + 1) {
								end = sortedRows[i]!;
							} else {
								ranges.push(start === end ? `${start}` : `${start}-${end}`);
								start = end = sortedRows[i]!;
							}
						}

						ranges.push(start === end ? `${start}` : `${start}-${end}`);

						return {
							code: group.code!,
							collection,
							field: group.field || '',
							type: group.type,
							group: null,
							rows: ranges.join(', '),
							count: group.rows.length,
							reason: group.reason,
						};
					});
				};

				saveQueue.drain(() => {
					if (structuredRows.length > 0) {
						cleanup();

						const groupedErrors = groupSimilarErrors(structuredRows);
						const limitedErrors = groupedErrors.slice(0, MAX_DISPLAY_ERRORS);
						const hasMoreErrors = groupedErrors.length > MAX_DISPLAY_ERRORS;

						reject(
							new InvalidImportError({
								reason: `Import failed with ${structuredRows.length} validation error(s)${structuredRows.length >= MAX_IMPORT_ERRORS ? ' (processing stopped due to error limit)' : ''}`,
								rows: limitedErrors,
								totalErrors: structuredRows.length,
								...(hasMoreErrors && { hasMoreErrors: true, totalErrorGroups: groupedErrors.length }),
							}),
						);

						return;
					}

					for (const nestedActionEvent of nestedActionEvents) {
						emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
					}

					resolve();
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

						csvReadStream = fileReadStream;
						streams.push(fileReadStream);

						fileReadStream
							.pipe(Papa.parse(Papa.NODE_STREAM_INPUT, PapaOptions))
							.on('data', (obj: Record<string, unknown>) => {
								rowNumber++;
								const result = {} as Record<string, unknown>;

								// Validate CSV structure
								if (!obj || typeof obj !== 'object') {
									structuredRows.push({
										row: rowNumber,
										code: ErrorCode.ImportStructureError,
										field: null,
										value: obj,
										reason: 'Invalid row data format',
										type: 'structure',
									});

									// Stop processing if too many errors
									if (structuredRows.length >= MAX_IMPORT_ERRORS && !hasReachedErrorLimit) {
										hasReachedErrorLimit = true;
										if (csvReadStream) csvReadStream.destroy();
										return;
									}

									return;
								}

								// Filter out only undefined fields
								for (const field in obj) {
									if (obj[field] !== undefined) {
										set(result, field, obj[field]);
									}
								}

								// Skip completely empty rows
								if (Object.keys(result).length === 0) {
									return;
								}

								// Check for Papa Parse extra columns (CSV structure error)
								if ('__parsed_extra' in result) {
									const extraColumns = result['__parsed_extra'] as unknown[];
									const errorMessage = `Row has ${extraColumns.length} extra column(s): ${extraColumns.join(', ')}. Please check your CSV structure.`;

									// Add structured error for CSV structure issue
									structuredRows.push({
										row: rowNumber,
										code: ErrorCode.ImportStructureError,
										field: null,
										value: extraColumns,
										reason: errorMessage,
										type: 'structure',
									});

									return;
								}

								// Stop processing if too many errors
								if (structuredRows.length >= MAX_IMPORT_ERRORS && !hasReachedErrorLimit) {
									hasReachedErrorLimit = true;
									if (csvReadStream) csvReadStream.destroy();
									return;
								}

								saveQueue.push({ data: result, rowNumber });
							})
							.on('error', (error) => {
								cleanup();

								reject(
									new InvalidPayloadError({
										reason: `Import parsing error: ${error.message}`,
									}),
								);
							})
							.on('end', () => {
								cleanup(false);

								// In case of empty CSV file
								if (!saveQueue.started) {
									return resolve();
								}
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
				? { transforms, header, fields: options?.fields }
				: { transforms, header };

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
