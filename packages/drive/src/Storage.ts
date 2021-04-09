import { MethodNotSupported } from './exceptions';
import {
	Response,
	SignedUrlResponse,
	ContentResponse,
	ExistsResponse,
	SignedUrlOptions,
	StatResponse,
	FileListResponse,
	DeleteResponse,
	Range,
} from './types';

export default abstract class Storage {
	/**
	 * Appends content to a file.
	 *
	 * Supported drivers: "local"
	 */
	append(_location: string, _content: Buffer | string): Promise<Response> {
		throw new MethodNotSupported('append', this.constructor.name);
	}

	/**
	 * Copy a file to a location.
	 *
	 * Supported drivers: "local", "s3", "gcs", "azure"
	 */
	copy(_src: string, _dest: string): Promise<Response> {
		throw new MethodNotSupported('copy', this.constructor.name);
	}

	/**
	 * Delete existing file.
	 * The value returned by this method will have a `wasDeleted` property that
	 * can be either a boolean (`true` if a file was deleted, `false` if there was
	 * no file to delete) or `null` (if no information about the file is available).
	 *
	 * Supported drivers: "local", "s3", "gcs", "azure"
	 */
	delete(_location: string): Promise<DeleteResponse> {
		throw new MethodNotSupported('delete', this.constructor.name);
	}

	/**
	 * Returns the driver.
	 *
	 * Supported drivers: "local", "s3", "gcs", "azure"
	 */
	public driver(): unknown {
		throw new MethodNotSupported('driver', this.constructor.name);
	}

	/**
	 * Determines if a file or folder already exists.
	 *
	 * Supported drivers: "local", "s3", "gcs", "azure"
	 */
	exists(_location: string): Promise<ExistsResponse> {
		throw new MethodNotSupported('exists', this.constructor.name);
	}

	/**
	 * Returns the file contents as a string.
	 *
	 * Supported drivers: "local", "s3", "gcs", "azure"
	 */
	get(_location: string, _encoding?: string): Promise<ContentResponse<string>> {
		throw new MethodNotSupported('get', this.constructor.name);
	}

	/**
	 * Returns the file contents as a Buffer.
	 *
	 * Supported drivers: "local", "s3", "gcs", "azure"
	 */
	getBuffer(_location: string): Promise<ContentResponse<Buffer>> {
		throw new MethodNotSupported('getBuffer', this.constructor.name);
	}

	/**
	 * Returns signed url for an existing file.
	 *
	 * Supported drivers: "s3", "gcs", "azure"
	 */
	getSignedUrl(_location: string, _options?: SignedUrlOptions): Promise<SignedUrlResponse> {
		throw new MethodNotSupported('getSignedUrl', this.constructor.name);
	}

	/**
	 * Returns file's size and modification date.
	 *
	 * Supported drivers: "local", "s3", "gcs", "azure"
	 */
	getStat(_location: string): Promise<StatResponse> {
		throw new MethodNotSupported('getStat', this.constructor.name);
	}

	/**
	 * Returns the stream for the given file.
	 *
	 * Supported drivers: "local", "s3", "gcs", "azure"
	 */
	getStream(_location: string, _range?: Range): NodeJS.ReadableStream {
		throw new MethodNotSupported('getStream', this.constructor.name);
	}

	/**
	 * Returns url for a given key. Note this method doesn't
	 * validates the existence of file or it's visibility
	 * status.
	 *
	 * Supported drivers: "s3", "gcs", "azure"
	 */
	getUrl(_location: string): string {
		throw new MethodNotSupported('getUrl', this.constructor.name);
	}

	/**
	 * Move file to a new location.
	 *
	 * Supported drivers: "local", "s3", "gcs", "azure"
	 */
	move(_src: string, _dest: string): Promise<Response> {
		throw new MethodNotSupported('move', this.constructor.name);
	}

	/**
	 * Creates a new file.
	 * This method will create missing directories on the fly.
	 *
	 * Supported drivers: "local", "s3", "gcs", "azure"
	 */
	put(_location: string, _content: Buffer | NodeJS.ReadableStream | string, _type?: string): Promise<Response> {
		throw new MethodNotSupported('put', this.constructor.name);
	}

	/**
	 * Prepends content to a file.
	 *
	 * Supported drivers: "local"
	 */
	prepend(_location: string, _content: Buffer | string): Promise<Response> {
		throw new MethodNotSupported('prepend', this.constructor.name);
	}

	/**
	 * List files with a given prefix.
	 *
	 * Supported drivers: "local", "s3", "gcs", "azure"
	 */
	flatList(_prefix?: string): AsyncIterable<FileListResponse> {
		throw new MethodNotSupported('flatList', this.constructor.name);
	}
}
