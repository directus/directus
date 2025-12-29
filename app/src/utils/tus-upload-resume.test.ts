/**
 * TUS Upload Resume - Integration Tests
 *
 * Tests for TUS resumable upload behavior when uploads are interrupted
 * and later resumed from browser localStorage fingerprints.
 *
 * These tests replicate the exact TUS configuration used in upload-file.ts:
 * - onShouldRetry() always returns false (retry disabled)
 * - onAfterResponse uses: fileInfo.id ??= res.getHeader('Directus-File-Id')
 */

import { beforeEach, describe, expect, test } from 'vitest';
import * as tus from 'tus-js-client';
import { Readable } from 'stream';

// ═══════════════════════════════════════════════════════════════════════════════
// TEST INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

type RequestInterceptor = (
	method: string,
	url: string,
	headers: Record<string, string>,
	body?: Buffer,
) => { status: number; headers: Record<string, string>; body?: string } | null;

class MockTusServer {
	public baseUrl = 'http://localhost:8055';
	private interceptors: RequestInterceptor[] = [];

	addInterceptor(interceptor: RequestInterceptor): this {
		this.interceptors.push(interceptor);
		return this;
	}

	handleRequest(
		method: string,
		url: string,
		headers: Record<string, string>,
		body?: Buffer,
	): { status: number; headers: Record<string, string>; body?: string } {
		for (const interceptor of this.interceptors) {
			const result = interceptor(method, url, headers, body);
			if (result) return result;
		}

		return { status: 404, headers: { 'Tus-Resumable': '1.0.0' } };
	}
}

class InMemoryUrlStorage implements tus.UrlStorage {
	public storage = new Map<string, tus.PreviousUpload[]>();

	async findAllUploads(): Promise<tus.PreviousUpload[]> {
		const all: tus.PreviousUpload[] = [];

		for (const uploads of this.storage.values()) {
			all.push(...uploads);
		}

		return all;
	}

	async findUploadsByFingerprint(fingerprint: string): Promise<tus.PreviousUpload[]> {
		return this.storage.get(fingerprint) || [];
	}

	async removeUpload(urlStorageKey: string): Promise<void> {
		for (const [key, uploads] of this.storage.entries()) {
			const filtered = uploads.filter((u) => u.urlStorageKey !== urlStorageKey);

			if (filtered.length !== uploads.length) {
				this.storage.set(key, filtered);
			}
		}
	}

	async addUpload(fingerprint: string, upload: tus.PreviousUpload): Promise<string> {
		const existing = this.storage.get(fingerprint) || [];
		existing.push(upload);
		this.storage.set(fingerprint, existing);
		return fingerprint;
	}
}

function createMockHttpStack(server: MockTusServer): tus.HttpStack {
	return {
		createRequest(method: string, url: string) {
			let headers: Record<string, string> = {};
			let bodyBuffer: Buffer | undefined;

			return {
				getMethod(): string {
					return method;
				},
				getURL(): string {
					return url;
				},
				setHeader(name: string, value: string) {
					headers[name] = value;
				},
				getHeader(name: string): string | undefined {
					return headers[name];
				},
				setProgressHandler() {},
				async send(body?: tus.HttpRequestBody): Promise<tus.HttpResponse> {
					if (body) {
						if (body instanceof Readable) {
							const chunks: Buffer[] = [];

							for await (const chunk of body) {
								chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
							}

							bodyBuffer = Buffer.concat(chunks);
						} else if (typeof body === 'string') {
							bodyBuffer = Buffer.from(body);
						} else if (body instanceof ArrayBuffer) {
							bodyBuffer = Buffer.from(body);
						} else if (ArrayBuffer.isView(body)) {
							bodyBuffer = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
						}
					}

					const response = server.handleRequest(method, url, headers, bodyBuffer);
					const responseHeaders = response.headers;

					return {
						getStatus(): number {
							return response.status;
						},
						getHeader(name: string): string | null {
							const value = responseHeaders[name] || responseHeaders[name.toLowerCase()];
							return value ?? null;
						},
						getBody(): string {
							return response.body || '';
						},
						getUnderlyingObject(): unknown {
							return {};
						},
					};
				},
				async abort(): Promise<void> {},
				getUnderlyingObject(): unknown {
					return {};
				},
			};
		},
		getName(): string {
			return 'MockHttpStack';
		},
	};
}

function decodeUploadMetadata(header: string): Record<string, string> {
	const result: Record<string, string> = {};
	if (!header) return result;

	const pairs = header.split(',');

	for (const pair of pairs) {
		const [key, base64Value] = pair.trim().split(' ');

		if (key && base64Value) {
			try {
				result[key] = Buffer.from(base64Value, 'base64').toString('utf8');
			} catch {
				result[key] = base64Value;
			}
		}
	}

	return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('TUS Upload Resume', () => {
	let server: MockTusServer;

	beforeEach(() => {
		server = new MockTusServer();
	});

	test('Small file: upload fails then resumes after session cleanup', async () => {
		const urlStorage = new InMemoryUrlStorage();
		let postCount = 0;
		let patchCount = 0;
		let headCount = 0;
		let currentUploadUrl: string | null = null;
		let dbQueryError: Error | null = null;

		const fileInfo: Record<string, any> = {
			filename_download: 'document.pdf',
			type: 'application/pdf',
		};

		const fileSize = 1024;
		const chunkSize = 1024;

		server.addInterceptor((method, url, headers) => {
			if (method === 'POST' && url.endsWith('/files/tus')) {
				postCount++;
				const metaHeader = headers['upload-metadata'] || headers['Upload-Metadata'];

				if (metaHeader) {
					const decoded = decodeUploadMetadata(metaHeader);

					if (decoded['id']) {
						const clientId = decoded['id'];
						const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

						if (!uuidRegex.test(clientId)) {
							dbQueryError = new Error(`invalid input syntax for type uuid: "${clientId}"`);

							return {
								status: 500,
								headers: { 'Tus-Resumable': '1.0.0' },
								body: JSON.stringify({ errors: [{ message: dbQueryError.message }] }),
							};
						}
					}
				}

				const sessionId = `session-${postCount}-${Date.now()}`;
				currentUploadUrl = `http://localhost:8055/files/tus/${sessionId}`;

				return {
					status: 201,
					headers: { 'Location': currentUploadUrl, 'Tus-Resumable': '1.0.0' },
				};
			}

			if (method === 'PATCH') {
				patchCount++;

				if (patchCount === 1) {
					return { status: 500, headers: { 'Tus-Resumable': '1.0.0' } };
				}

				return {
					status: 204,
					headers: {
						'Upload-Offset': String(fileSize),
						'Tus-Resumable': '1.0.0',
						'Directus-File-Id': 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
					},
				};
			}

			if (method === 'HEAD') {
				headCount++;
				return { status: 404, headers: { 'Tus-Resumable': '1.0.0' } };
			}

			return null;
		});

		// First upload attempt
		try {
			await new Promise<void>((resolve, reject) => {
				const stream = Readable.from([Buffer.alloc(fileSize, 'x')]);
				const upload = new tus.Upload(stream, {
					endpoint: server.baseUrl + '/files/tus',
					uploadSize: fileSize,
					chunkSize,
					metadata: fileInfo as Record<string, string>,
					retryDelays: [],
					urlStorage,
					httpStack: createMockHttpStack(server),
					onError: reject,
					onSuccess: resolve,
					onAfterResponse(_req, res) {
						const headerValue = res.getHeader('Directus-File-Id');
						fileInfo.id ??= headerValue;
					},
				});

				upload.start();
			});
		} catch {
			// Expected to fail
		}

		// Store fingerprint
		const fingerprint = `tus-br-document.pdf-application/pdf-${fileSize}`;

		if (currentUploadUrl) {
			const stored = JSON.parse(
				JSON.stringify({
					uploadUrl: currentUploadUrl,
					urlStorageKey: fingerprint,
					size: fileSize,
					metadata: { ...fileInfo },
					creationTime: new Date().toString(),
				}),
			);

			await urlStorage.addUpload(fingerprint, stored);
		}

		// Retry
		const retryFileInfo: Record<string, any> = {
			filename_download: 'document.pdf',
			type: 'application/pdf',
		};

		const previousUploads = await urlStorage.findUploadsByFingerprint(fingerprint);

		if (previousUploads.length > 0) {
			retryFileInfo.id = previousUploads[0]!.metadata?.['id'];
		}

		try {
			await new Promise<void>((resolve, reject) => {
				const stream = Readable.from([Buffer.alloc(fileSize, 'x')]);
				const upload = new tus.Upload(stream, {
					endpoint: server.baseUrl + '/files/tus',
					uploadSize: fileSize,
					chunkSize,
					metadata: retryFileInfo as Record<string, string>,
					retryDelays: [],
					urlStorage,
					httpStack: createMockHttpStack(server),
					onError: reject,
					onSuccess: resolve,
				});

				if (previousUploads.length > 0) {
					upload.resumeFromPreviousUpload(previousUploads[0]!);
				}

				upload.start();
			});
		} catch {
			// May fail
		}

		expect(dbQueryError).toBeNull();
	});

	test('Large file: upload interrupted between chunks, server cleans up session', async () => {
		const urlStorage = new InMemoryUrlStorage();
		let postCount = 0;
		let patchCount = 0;
		let headCount = 0;
		let sessionCleaned = false;
		let currentUploadUrl: string | null = null;
		const capturedPostMetadata: Record<string, string>[] = [];

		const fileInfo: Record<string, any> = {
			filename_download: 'large-video.mp4',
			type: 'video/mp4',
		};

		const chunkSize = 1024;
		const totalSize = 5 * chunkSize;

		server.addInterceptor((method, url, headers) => {
			if (method === 'POST' && url.endsWith('/files/tus')) {
				postCount++;
				const metaHeader = headers['upload-metadata'] || headers['Upload-Metadata'];

				if (metaHeader) {
					const decoded = decodeUploadMetadata(metaHeader);
					capturedPostMetadata.push(decoded);
				}

				const sessionId = `large-upload-${postCount}`;
				currentUploadUrl = `http://localhost:8055/files/tus/${sessionId}`;

				return {
					status: 201,
					headers: { 'Location': currentUploadUrl, 'Tus-Resumable': '1.0.0' },
				};
			}

			if (method === 'PATCH') {
				patchCount++;
				const offset = parseInt(headers['upload-offset'] || '0');
				const newOffset = offset + chunkSize;

				if (patchCount <= 2 && !sessionCleaned) {
					return {
						status: 204,
						headers: { 'Upload-Offset': String(newOffset), 'Tus-Resumable': '1.0.0' },
					};
				}

				if (sessionCleaned && url.includes('large-upload-1')) {
					return { status: 404, headers: { 'Tus-Resumable': '1.0.0' } };
				}

				if (sessionCleaned && postCount > 1) {
					const finalOffset = Math.min(offset + chunkSize, totalSize);
					const responseHeaders: Record<string, string> = {
						'Upload-Offset': String(finalOffset),
						'Tus-Resumable': '1.0.0',
					};

					if (finalOffset >= totalSize) {
						responseHeaders['Directus-File-Id'] = 'final-uuid-12345';
					}

					return { status: 204, headers: responseHeaders };
				}

				return { status: 500, headers: { 'Tus-Resumable': '1.0.0' } };
			}

			if (method === 'HEAD') {
				headCount++;

				if (sessionCleaned) {
					return { status: 404, headers: { 'Tus-Resumable': '1.0.0' } };
				}

				return {
					status: 200,
					headers: {
						'Upload-Offset': String(2 * chunkSize),
						'Upload-Length': String(totalSize),
						'Tus-Resumable': '1.0.0',
					},
				};
			}

			return null;
		});

		// Start uploading
		try {
			await new Promise<void>((resolve, reject) => {
				const stream = Readable.from([Buffer.alloc(totalSize, 'x')]);
				const upload = new tus.Upload(stream, {
					endpoint: server.baseUrl + '/files/tus',
					uploadSize: totalSize,
					chunkSize,
					metadata: fileInfo as Record<string, string>,
					retryDelays: [],
					urlStorage,
					httpStack: createMockHttpStack(server),
					onError: reject,
					onSuccess: resolve,
					onAfterResponse(_req, res) {
						const headerValue = res.getHeader('Directus-File-Id');
						fileInfo.id ??= headerValue;
					},
				});

				upload.start();
			});
		} catch {
			// Expected
		}

		// Store fingerprint
		const fingerprint = `tus-br-large-video.mp4-video/mp4-${totalSize}`;

		if (currentUploadUrl) {
			const stored = JSON.parse(
				JSON.stringify({
					uploadUrl: currentUploadUrl,
					urlStorageKey: fingerprint,
					size: totalSize,
					metadata: { ...fileInfo },
					creationTime: new Date().toString(),
				}),
			);

			await urlStorage.addUpload(fingerprint, stored);
		}

		// Server cleanup
		sessionCleaned = true;

		// User resumes
		const retryFileInfo: Record<string, any> = {
			filename_download: 'large-video.mp4',
			type: 'video/mp4',
		};

		const previousUploads = await urlStorage.findUploadsByFingerprint(fingerprint);

		if (previousUploads.length > 0) {
			retryFileInfo.id = previousUploads[0]!.metadata?.['id'];
		}

		try {
			await new Promise<void>((resolve, reject) => {
				const stream = Readable.from([Buffer.alloc(totalSize, 'x')]);
				const upload = new tus.Upload(stream, {
					endpoint: server.baseUrl + '/files/tus',
					uploadSize: totalSize,
					chunkSize,
					metadata: retryFileInfo as Record<string, string>,
					retryDelays: [],
					urlStorage,
					httpStack: createMockHttpStack(server),
					onError: reject,
					onSuccess: resolve,
				});

				if (previousUploads.length > 0) {
					upload.resumeFromPreviousUpload(previousUploads[0]!);
				}

				upload.start();
			});
		} catch {
			// May fail
		}

		const invalidPost = capturedPostMetadata.find((m) => m['id'] === 'null');
		expect(invalidPost).toBeUndefined();
	});

	test('Single upload fails on PATCH error (no retry configured)', async () => {
		const urlStorage = new InMemoryUrlStorage();
		let postCount = 0;
		let patchCount = 0;
		let uploadFailed = false;

		const fileInfo: Record<string, any> = {
			filename_download: 'single-upload.pdf',
			type: 'application/pdf',
		};

		const fileSize = 1024;
		const chunkSize = 1024;

		server.addInterceptor((method, url, headers) => {
			if (method === 'POST' && url.endsWith('/files/tus')) {
				postCount++;
				const sessionId = `session-${postCount}-${Date.now()}`;

				return {
					status: 201,
					headers: {
						'Location': `http://localhost:8055/files/tus/${sessionId}`,
						'Tus-Resumable': '1.0.0',
					},
				};
			}

			if (method === 'PATCH') {
				patchCount++;
				// PATCH fails with 500
				return { status: 500, headers: { 'Tus-Resumable': '1.0.0' } };
			}

			return null;
		});

		// Single upload attempt WITHOUT retry (like production v11.14)
		try {
			await new Promise<void>((resolve, reject) => {
				const stream = Readable.from([Buffer.alloc(fileSize, 'x')]);
				const upload = new tus.Upload(stream, {
					endpoint: server.baseUrl + '/files/tus',
					uploadSize: fileSize,
					chunkSize,
					metadata: fileInfo as Record<string, string>,
					retryDelays: [], // No retry - like production
					urlStorage,
					httpStack: createMockHttpStack(server),
					onError: reject,
					onSuccess: resolve,
					onAfterResponse(_req, res) {
						const headerValue = res.getHeader('Directus-File-Id');
						fileInfo.id ??= headerValue;
					},
				});

				upload.start();
			});
		} catch {
			uploadFailed = true;
		}

		// Without retry, upload should fail after first PATCH error
		expect(uploadFailed).toBe(true);
		expect(postCount).toBe(1);
		expect(patchCount).toBe(1);
	});

	test('Single upload succeeds with retry on PATCH 500 error', async () => {
		const urlStorage = new InMemoryUrlStorage();
		let postCount = 0;
		let patchCount = 0;
		let uploadSucceeded = false;
		let dbQueryError: Error | null = null;

		const fileInfo: Record<string, any> = {
			filename_download: 'retry-upload.pdf',
			type: 'application/pdf',
		};

		const fileSize = 1024;
		const chunkSize = 1024;

		server.addInterceptor((method, url, headers) => {
			if (method === 'POST' && url.endsWith('/files/tus')) {
				postCount++;

				// Validate UUID in metadata (like real server does)
				const metaHeader = headers['upload-metadata'] || headers['Upload-Metadata'];
				if (metaHeader) {
					const decoded = decodeUploadMetadata(metaHeader);
					if (decoded['id']) {
						const clientId = decoded['id'];
						const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

						if (!uuidRegex.test(clientId)) {
							dbQueryError = new Error(`invalid input syntax for type uuid: "${clientId}"`);
							return {
								status: 500,
								headers: { 'Tus-Resumable': '1.0.0' },
								body: JSON.stringify({ errors: [{ message: dbQueryError.message }] }),
							};
						}
					}
				}

				const sessionId = `session-${postCount}-${Date.now()}`;

				return {
					status: 201,
					headers: {
						'Location': `http://localhost:8055/files/tus/${sessionId}`,
						'Tus-Resumable': '1.0.0',
					},
				};
			}

			if (method === 'PATCH') {
				patchCount++;

				// First PATCH fails with 500, second succeeds
				if (patchCount === 1) {
					return { status: 500, headers: { 'Tus-Resumable': '1.0.0' } };
				}

				return {
					status: 204,
					headers: {
						'Upload-Offset': String(fileSize),
						'Tus-Resumable': '1.0.0',
						'Directus-File-Id': 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
					},
				};
			}

			return null;
		});

		// Upload WITH retry enabled
		try {
			await new Promise<void>((resolve, reject) => {
				const stream = Readable.from([Buffer.alloc(fileSize, 'x')]);
				const upload = new tus.Upload(stream, {
					endpoint: server.baseUrl + '/files/tus',
					uploadSize: fileSize,
					chunkSize,
					metadata: fileInfo as Record<string, string>,
					retryDelays: [0, 100, 200], // Retry enabled
					urlStorage,
					httpStack: createMockHttpStack(server),
					onError: reject,
					onSuccess: () => {
						uploadSucceeded = true;
						resolve();
					},
					onShouldRetry(err, retryAttempt) {
						// Retry on 5xx errors
						if (retryAttempt < 5 && err?.originalResponse?.getStatus() >= 500) {
							return true;
						}
						return false;
					},
					onAfterResponse(_req, res) {
						const headerValue = res.getHeader('Directus-File-Id');
						fileInfo.id ??= headerValue;
					},
				});

				upload.start();
			});
		} catch {
			// May fail due to null ID bug
		}

		// This test will FAIL if the null ID bug is present
		// because retry causes a new POST with id="null" in metadata
		expect(dbQueryError).toBeNull();
	});

	test('XHR getHeader returns null for missing headers', () => {
		const mockResponse = {
			headers: { 'Content-Type': 'text/plain' } as Record<string, string>,
			getHeader(name: string): string | null {
				return this.headers[name] ?? null;
			},
		};

		expect(mockResponse.getHeader('Content-Type')).toBe('text/plain');
		expect(mockResponse.getHeader('Directus-File-Id')).toBeNull();
	});

	test('Nullish coalescing assigns null values', () => {
		const fileInfo: { id?: string | null } = {};
		const headerValue: string | null = null;

		fileInfo.id ??= headerValue;

		expect(fileInfo.id).toBeNull();
		expect(String(fileInfo.id)).toBe('null');
		expect(Buffer.from(String(fileInfo.id)).toString('base64')).toBe('bnVsbA==');
	});

	test('JSON stringify/parse preserves null', () => {
		const original = { id: null, name: 'test' };
		const serialized = JSON.stringify(original);
		const restored = JSON.parse(serialized);

		expect(restored.id).toBeNull();
		expect(serialized).toBe('{"id":null,"name":"test"}');
	});
});
