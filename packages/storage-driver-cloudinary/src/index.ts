import type { Driver, Range } from '@directus/storage';
import { normalizePath } from '@directus/utils';
import { createHash } from 'node:crypto';
import { extname, join, parse } from 'node:path';
import { Readable } from 'node:stream';
import { fetch } from 'undici';
import type { RequestInit } from 'undici';
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from './constants.js';

export type DriverCloudinaryConfig = {
	root?: string;
	cloudName: string;
	apiKey: string;
	apiSecret: string;
	accessMode: 'public' | 'authenticated';
};

export class DriverCloudinary implements Driver {
	private root: string;
	private apiKey: string;
	private apiSecret: string;
	private cloudName: string;
	private accessMode: 'public' | 'authenticated';

	constructor(config: DriverCloudinaryConfig) {
		this.root = config.root ? normalizePath(config.root, { removeLeading: true }) : '';
		this.apiKey = config.apiKey;
		this.apiSecret = config.apiSecret;
		this.cloudName = config.cloudName;
		this.accessMode = config.accessMode;
	}

	private fullPath(filepath: string) {
		return normalizePath(join(this.root, filepath), { removeLeading: true });
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
			.digest('base64url')
			.substring(0, 8)}--`;
	}

	private getTimestamp() {
		return new Date().getTime();
	}

	/**
	 * Used to guess what resource type is appropriate for a given filepath
	 * @see https://cloudinary.com/documentation/image_transformations#image_upload_note
	 */
	private getResourceType(fileExtension: string) {
		if (IMAGE_EXTENSIONS.includes(fileExtension)) return 'image';
		if (VIDEO_EXTENSIONS.includes(fileExtension)) return 'video';
		return 'raw';
	}

	/**
	 * For Cloudinary Admin APIs, the file extension needs to be omitted for images and videos. Raw
	 * on the other hand requires the extension to be present.
	 */
	private getPublicId(filepath: string) {
		const resourceType = this.getResourceType(filepath);
		if (resourceType === 'raw') return filepath;
		return parse(filepath).name;
	}

	/**
	 * Generates the Authorization header value for Cloudinary's basic auth endpoints
	 */
	private getBasicAuth() {
		const creds = `${this.apiKey}:${this.apiSecret}`;
		const base64 = Buffer.from(creds).toString('base64');
		return `Basic ${base64}`;
	}

	async read(filepath: string, range?: Range) {
		const resourceType = this.getResourceType(extname(filepath));
		const fullPath = this.fullPath(filepath);
		const signature = this.getParameterSignature(fullPath);
		const url = `https://res.cloudinary.com/${this.cloudName}/${resourceType}/upload/${signature}/${fullPath}`;

		const requestInit: RequestInit = { method: 'GET' };

		if (range) {
			requestInit.headers = {
				Range: `bytes=${range.start ?? ''}-${range.end ?? ''}`,
			};
		}

		const response = await fetch(url, requestInit);

		if (response.status >= 400 || !response.body) {
			throw new Error(`No stream returned for file "${filepath}"`);
		}

		return Readable.fromWeb(response.body);
	}

	async stat(filepath: string) {
		const fullPath = this.fullPath(filepath);
		const resourceType = this.getResourceType(fullPath);
		const publicId = this.getPublicId(fullPath);
		const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/resources/${resourceType}/upload/${publicId}`;

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: this.getBasicAuth(),
			},
		});

		const { bytes, created_at } = (await response.json()) as { bytes: number; created_at: string };

		return { size: bytes, modified: new Date(created_at) };
	}

	async exists(filepath: string) {}

	async move(src: string, dest: string) {}

	async copy(src: string, dest: string) {}

	async write(filepath: string, content: Buffer | NodeJS.ReadableStream | string, type = 'application/octet-stream') {}

	async delete(filepath: string) {}

	async *list(prefix = '') {}
}

export default DriverCloudinary;
