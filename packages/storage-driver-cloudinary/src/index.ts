import { normalizePath } from '@directus/utils';
import { isReadableStream } from '@directus/utils/node';
import type { Driver, Range } from '@directus/storage';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { PassThrough } from 'node:stream';
import FormData from 'form-data';
import { createHash } from 'node:crypto';
import { stream } from 'undici';

export type DriverCloudinaryConfig = {
	root?: string;
	cloudName: string;
	apiKey: string;
	apiSecret: string;
};

export class DriverCloudinary implements Driver {
	private root: string;
	private apiKey: string;
	private apiSecret: string;
	private cloudName: string;

	constructor(config: DriverCloudinaryConfig) {
		this.root = config.root ? normalizePath(config.root, { removeLeading: true }) : '';
		this.apiKey = config.apiKey;
		this.apiSecret = config.apiSecret;
		this.cloudName = config.cloudName;
	}

	private fullPath(filepath: string) {
		return normalizePath(join(this.root, filepath));
	}

	private toFormUrlEncoded(obj: Record<string, string>, options?: { sort: boolean }) {
		let entries = Object.entries(obj);

		if (options?.sort) {
			entries = entries.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
		}

		return new URLSearchParams(entries).toString();
	}

	/**
	 * Generate the Cloudinary SHA1 signature for the given payload
	 * @see https://cloudinary.com/documentation/signatures
	 */
	private getFullSignature(payload: Record<string, string>) {
		const denylist = ['file', 'cloud_name', 'resource_type', 'api_key'];

		const signaturePayload = Object.fromEntries(
			Object.entries(payload).filter(([key]) => denylist.includes(key) === false)
		);

		const signaturePayloadString = this.toFormUrlEncoded(signaturePayload, { sort: true });

		return createHash('sha1')
			.update(signaturePayloadString + this.apiSecret)
			.digest('hex');
	}

	/**
	 * Creates inline URL signature for use with the image reading API
	 * @see https://cloudinary.com/documentation/advanced_url_delivery_options#generating_delivery_url_signatures
	 */
	private getParameterSignature(filepath: string) {
		return `s--${createHash('sha1')
			.update(filepath + this.apiSecret)
			.digest('base64')
			.substring(0, 8)}--`;
	}

	private getTimestamp() {
		return new Date().getTime();
	}

	async getStream(filepath: string, range?: Range) {}

	async getBuffer(filepath: string) {}

	async getStat(filepath: string) {}

	async exists(filepath: string) {}

	async move(src: string, dest: string) {}

	async copy(src: string, dest: string) {}

	async put(filepath: string, content: Buffer | NodeJS.ReadableStream | string, type = 'application/octet-stream') {}

	async delete(filepath: string) {}

	async *list(prefix = '') {}
}

export default DriverCloudinary;
