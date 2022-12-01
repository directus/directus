import { LocalFileSystemStorageConfig } from './LocalFileSystemStorage';

export type { LocalFileSystemStorageConfig };

export interface Storage {
	copy(src: string, dest: string): Promise<Response>;
	delete(location: string): Promise<DeleteResponse>;
	get(location: string, encoding?: string): Promise<ContentResponse<string>>;
	getBuffer(location: string): Promise<ContentResponse<Buffer>>;
	getStream(location: string, range?: Range): NodeJS.ReadableStream;
	getStat(_location: string): Promise<StatResponse>;
	move(_src: string, _dest: string): Promise<Response>;
	put(_location: string, _content: Buffer | NodeJS.ReadableStream | string, _type?: string): Promise<Response>;
	flatList(_prefix?: string): AsyncIterable<FileListResponse>;
}

export type StorageManagerSingleDiskConfig =
	| {
			driver: 'local';
			config: LocalFileSystemStorageConfig;
	  }
	| {
			driver: string;
			config: unknown;
	  };

export interface StorageManagerDiskConfig {
	[key: string]: StorageManagerSingleDiskConfig;
}

export interface StorageManagerConfig {
	/**
	 * The default disk returned by `disk()`.
	 */
	default?: string;
	disks?: StorageManagerDiskConfig;
}

export interface Response {
	raw: unknown;
}

export interface ExistsResponse extends Response {
	exists: boolean;
}

export interface ContentResponse<ContentType> extends Response {
	content: ContentType;
}

export interface SignedUrlOptions {
	/**
	 * Expiration time of the URL.
	 * It should be a number of seconds from now.
	 * @default `900` (15 minutes)
	 */
	expiry?: number;
}

export interface SignedUrlResponse extends Response {
	signedUrl: string;
}

export interface StatResponse extends Response {
	size: number;
	modified: Date;
}

export interface FileListResponse extends Response {
	path: string;
}

export interface DeleteResponse extends Response {
	wasDeleted: boolean | null;
}

export interface Range {
	start: number | undefined;
	end: number | undefined;
}
