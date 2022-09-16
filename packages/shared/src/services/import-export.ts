import { Knex } from 'knex';
import { Accountability, File, Query, SchemaOverview } from '../types';
export declare interface ImportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	import(collection: string, mimetype: string, stream: NodeJS.ReadableStream): Promise<void>;
	importJSON(collection: string, stream: NodeJS.ReadableStream): Promise<void>;
	importCSV(collection: string, stream: NodeJS.ReadableStream): Promise<void>;
}
export declare interface ExportService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	/**
	 * Export the query results as a named file. Will query in batches, and keep appending a tmp file
	 * until all the data is retrieved. Uploads the result as a new file using the regular
	 * FilesService upload method.
	 */
	exportToFile(
		collection: string,
		query: Partial<Query>,
		format: 'xml' | 'csv' | 'json',
		options?: {
			file?: Partial<File>;
		}
	): Promise<void>;
	/**
	 * Transform a given input object / array to the given type
	 */
	transform(
		input: Record<string, any>[],
		format: 'xml' | 'csv' | 'json',
		options?: {
			includeHeader?: boolean;
			includeFooter?: boolean;
		}
	): string;
}
