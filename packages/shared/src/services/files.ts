import { File, Metadata, MutationOptions, PrimaryKey } from '../types';
import { ItemsService } from './items';
export declare interface FilesService extends ItemsService {
	/**
	 * Upload a single new file to the configured storage adapter
	 */
	uploadOne(
		stream: NodeJS.ReadableStream,
		data: Partial<File> & {
			filename_download: string;
			storage: string;
		},
		primaryKey?: PrimaryKey,
		opts?: MutationOptions
	): Promise<PrimaryKey>;
	/**
	 * Extract metadata from a buffer's content
	 */
	getMetadata(bufferContent: any, allowList?: any): Promise<Metadata>;
	/**
	 * Import a single file from an external URL
	 */
	importOne(importURL: string, body: Partial<File>): Promise<PrimaryKey>;
	/**
	 * Delete a file
	 */
	deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey>;
	/**
	 * Delete multiple files
	 */
	deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]>;
}
