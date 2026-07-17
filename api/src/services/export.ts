import { createReadStream } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import { useEnv } from '@directus/env';
import { ServiceUnavailableError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	Accountability,
	ExportFormat,
	File,
	Query,
	SchemaOverview,
} from '@directus/types';
import { getDateTimeFormatted } from '@directus/utils';
import { dump as toYAML } from 'js-yaml';
import { parse as toXML } from 'js2xmlparser';
import { Parser as CSVParser, transforms as CSVTransforms } from 'json2csv';
import type { Knex } from 'knex';
import { parseFields } from '../database/get-ast-from-query/lib/parse-fields.js';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../types/index.js';
import { getService } from '../utils/get-service.js';
import { transaction } from '../utils/transaction.js';
import { Url } from '../utils/url.js';
import { userName } from '../utils/user-name.js';
import { FilesService } from './files.js';
import { NotificationsService } from './notifications.js';
import { UsersService } from './users.js';

const env = useEnv();
const logger = useLogger();

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
