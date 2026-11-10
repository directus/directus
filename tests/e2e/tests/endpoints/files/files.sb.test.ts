import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { sandbox } from '@directus/sandbox';
import {
	createDirectus,
	createPolicy,
	createUser,
	customEndpoint,
	deleteFile,
	type DirectusClient,
	readAssetArrayBuffer,
	readFiles,
	rest,
	type RestClient,
	staticToken,
	updateFile,
	updatePolicy,
	uploadFiles,
} from '@directus/sdk';
import type { Permission } from '@directus/types';
import { database } from '@utils/constants.js';
import { directusError } from '@utils/errors.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { useSandbox } from '@utils/sandbox.js';
import { Upload } from 'tus-js-client';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { LICENSE_KEYS } from '../../license/__fixtures__/licenses.js';

let directus: Awaited<ReturnType<typeof sandbox>>;
let api: DirectusClient<unknown> & RestClient<unknown>;
let apiUrl: string;

const uploadedIds: string[] = [];

function uploadViaTus(
	content: Buffer,
	metadata: Record<string, string>,
	opts: { token?: string; chunkSize?: number } = {},
) {
	return new Promise<void>((resolve, reject) => {
		const upload = new Upload(content, {
			endpoint: `${apiUrl}/files/tus`,
			headers: { Authorization: `Bearer ${opts.token ?? 'admin'}` },
			chunkSize: opts.chunkSize ?? content.byteLength,
			metadata,
			removeFingerprintOnSuccess: true,
			onError: reject,
			onSuccess: () => resolve(),
			onShouldRetry: () => false,
		});

		upload.start();
	});
}

/**
 * Create a non-admin user whose policy grants the given directus_files
 * permissions, returning a static token to authenticate as them. Only the
 * fields that matter per test need to be passed; the rest are defaulted.
 */
async function createFilesUser(permissions: Partial<Permission>[]) {
	const token = randomUUID();

	const user = await api.request<{ id: string }>(
		createUser({ first_name: 'Test', last_name: 'Files', email: `${token}@files.com`, password: 'password', token }),
	);

	const policy = await api.request<{ id: string }>(
		createPolicy({
			name: `files-${randomUUID()}`,
			admin_access: false,
			app_access: false,
			users: [{ user: user.id }],
			permissions: [],
		}),
	);

	await api.request(
		updatePolicy(policy.id, {
			permissions: permissions.map((perm) => ({ collection: 'directus_files', fields: ['*'], ...perm })) as any,
		}),
	);

	return token;
}

async function findFileByDownloadName(filenameDownload: string) {
	const [file] = await api.request<{ id: string }[]>(
		readFiles({
			filter: { filename_download: { _eq: filenameDownload } },
			fields: ['id'],
			limit: 1,
		}),
	);

	return file;
}

async function uploadToLocal(filenameDisk: string) {
	return uploadToStorage('local', filenameDisk);
}

async function uploadToStorage(storage: string, filenameDisk: string) {
	const form = new FormData();
	form.set('storage', storage);
	form.set('filename_disk', filenameDisk);
	form.set('file', new Blob([Buffer.from('forbidden-path-test')], { type: 'application/octet-stream' }), 'file.bin');

	const result = await api.request<{ id: string }>(uploadFiles(form));
	uploadedIds.push(result.id);
	return result;
}

beforeAll(async () => {
	directus = await useSandbox(database, {
		port: sandboxPort(0),
		inspect: false,
		prefix: `files-sb-${getUID()}`,
		env: {
			TUS_ENABLED: 'true',
			STORAGE_LOCATIONS: 'local,secondary',
			STORAGE_SECONDARY_DRIVER: 'local',
			STORAGE_SECONDARY_ROOT: './uploads/secondary',
			EXTENSIONS_PATH: './uploads/extensions',
			TEMP_PATH: './uploads/temp',
			DB_FILENAME: `directus_test_${getUID()}.db`,
			LICENSE_KEY: LICENSE_KEYS.UNLIMITED,
		},
		extras: { license: true },
		docker: {
			suffix: getUID(),
		},
		cache: false,
		knex: true,
	});

	apiUrl = `http://127.0.0.1:${directus.apis[0].port}`;
	api = createDirectus<unknown>(apiUrl).with(rest()).with(staticToken('admin'));
});

afterAll(async () => {
	await directus?.stop();
});

afterEach(async () => {
	while (uploadedIds.length > 0) {
		await api.request(deleteFile(uploadedIds.pop()!)).catch(() => {});
	}
});

describe('/files/tus', () => {
	test('creates a file from a resumable upload', async () => {
		const filenameDownload = `${randomUUID()}.bin`;

		await uploadViaTus(Buffer.from('tus'), { filename_download: filenameDownload, type: 'application/octet-stream' });

		const file = await findFileByDownloadName(filenameDownload);

		expect(file?.id).toBeDefined();
	});

	test('reassembles a multi-chunk upload into the original content', async () => {
		const filenameDownload = `${randomUUID()}.bin`;
		// Larger than the chunk size below so the upload spans several PATCH requests
		const content = randomBytes(20000);

		await uploadViaTus(
			content,
			{ filename_download: filenameDownload, type: 'application/octet-stream' },
			{ chunkSize: 8000 },
		);

		const file = await findFileByDownloadName(filenameDownload);
		const downloaded = await api.request(readAssetArrayBuffer(file!.id));

		const originalHash = createHash('sha256').update(content).digest('hex');
		const downloadedHash = createHash('sha256').update(Buffer.from(downloaded)).digest('hex');

		expect(downloadedHash).toEqual(originalHash);
	});

	test('replaces an existing file via a resumable upload to its id', async () => {
		const originalName = `${randomUUID()}.bin`;

		await uploadViaTus(Buffer.from('tus'), { filename_download: originalName, type: 'application/octet-stream' });
		const created = await findFileByDownloadName(originalName);

		const replacementName = `changed_${originalName}`;

		await uploadViaTus(Buffer.from('tus replaced'), {
			filename_download: replacementName,
			type: 'application/octet-stream',
			id: created!.id,
		});

		const replaced = await findFileByDownloadName(replacementName);

		expect(replaced?.id).toBe(created!.id);
	});

	test('rejects a resumable upload from a user without create permission on files', async () => {
		const token = await createFilesUser([{ action: 'read' }]);
		const filenameDownload = `${randomUUID()}.bin`;

		await expect(
			uploadViaTus(
				Buffer.from('tus'),
				{ filename_download: filenameDownload, type: 'application/octet-stream' },
				{ token },
			),
		).rejects.toThrow();
	});

	test('allows a resumable upload from a user with create permission on files', async () => {
		const token = await createFilesUser([{ action: 'create' }, { action: 'read' }, { action: 'update' }]);
		const filenameDownload = `${randomUUID()}.bin`;

		await uploadViaTus(
			Buffer.from('tus'),
			{ filename_download: filenameDownload, type: 'application/octet-stream' },
			{ token },
		);

		const file = await findFileByDownloadName(filenameDownload);

		expect(file?.id).toBeDefined();
	});

	test('enforces row-level update permission when replacing a file via tus', async () => {
		const original = Buffer.from('original-bytes');
		const targetName = `${randomUUID()}.bin`;
		await uploadViaTus(original, { filename_download: targetName, type: 'application/octet-stream' });
		const target = await findFileByDownloadName(targetName);

		// This user may only update files they uploaded themselves
		const token = await createFilesUser([
			{ action: 'create' },
			{ action: 'read' },
			{ action: 'update', permissions: { uploaded_by: { _eq: '$CURRENT_USER' } } },
		]);

		await expect(
			uploadViaTus(
				Buffer.from('attacker-bytes'),
				{ filename_download: `${randomUUID()}.bin`, type: 'application/octet-stream', id: target!.id },
				{ token },
			),
		).rejects.toThrow();

		// The original bytes must be untouched
		const downloaded = await api.request(readAssetArrayBuffer(target!.id));
		expect(Buffer.from(downloaded).equals(original)).toBe(true);
	});

	test('rejects a resumable upload to a forbidden storage path with the underlying 403, not a generic 500', async () => {
		const err = await uploadViaTus(Buffer.from('tus'), {
			filename_download: `${randomUUID()}.bin`,
			type: 'application/octet-stream',
			filename_disk: 'extensions/evil.js',
		}).catch((error) => error);

		expect(err).toBeInstanceOf(Error);
		expect(err.originalResponse?.getStatus()).toBe(403);
	});

	test('rejects renaming an upload that is still in progress', async () => {
		const name = `${randomUUID()}.bin`;
		const encode = (value: string) => Buffer.from(value).toString('base64');

		// Create the upload without sending any data, so it stays in progress
		const response = await fetch(`${apiUrl}/files/tus`, {
			method: 'POST',
			headers: {
				Authorization: 'Bearer admin',
				'Tus-Resumable': '1.0.0',
				'Upload-Length': '1024',
				'Upload-Metadata': `filename_download ${encode(name)},type ${encode('application/octet-stream')}`,
			},
		});

		expect(response.status).toBe(201);

		// Uploads in progress are hidden from the api, so look the record up directly
		const tusId = response.headers.get('location')!.split('/').pop();

		const upload = await directus.knex!('directus_files')
			.select('id', 'filename_disk')
			.where({ tus_id: tusId })
			.first();

		await expect(api.request(updateFile(upload.id, { filename_disk: `renamed-${name}` }))).rejects.toMatchObject({
			errors: [expect.objectContaining({ extensions: expect.objectContaining({ code: 'FORBIDDEN' }) })],
		});

		const record = await directus.knex!('directus_files').select('filename_disk').where({ id: upload.id }).first();

		expect(record?.filename_disk).toBe(upload.filename_disk);
	});
});

describe('forbidden storage paths', () => {
	const forbidden = directusError('FORBIDDEN');
	const invalidPayload = directusError('INVALID_PAYLOAD');

	// The api runs from this process' cwd, so the "local" storage root resolves to the same folder
	function existsInExtensions(filename: string) {
		return existsSync(resolve('uploads', 'extensions', filename));
	}

	function createFileRecord(data: Record<string, unknown>) {
		return api.request<{ id: string }>(
			customEndpoint({
				path: '/files',
				method: 'POST',
				body: JSON.stringify({ type: 'text/javascript', filename_download: 'index.js', ...data }),
			}),
		);
	}

	test('rejects an upload that writes into the extensions directory', async () => {
		await expect(uploadToLocal('extensions/evil.js')).rejects.toMatchObject(forbidden);
	});

	test('rejects an upload that writes into the temp directory', async () => {
		await expect(uploadToLocal('temp/evil.js')).rejects.toMatchObject(forbidden);
	});

	test('allows an upload to a sibling folder that merely shares the extensions prefix', async () => {
		const upload = await uploadToLocal('extensions-backup/image.jpg');

		expect(upload.id).toBeDefined();
	});

	test('rejects renaming a file into the extensions directory', async () => {
		const name = `${randomUUID()}.js`;
		const file = await uploadToLocal(`${randomUUID()}.js`);

		await expect(api.request(updateFile(file.id, { filename_disk: `extensions/${name}` }))).rejects.toMatchObject(
			forbidden,
		);

		expect(existsInExtensions(name)).toBe(false);

		// The file is left in place
		const downloaded = await api.request(readAssetArrayBuffer(file.id));
		expect(Buffer.from(downloaded).toString()).toBe('forbidden-path-test');
	});

	test('rejects a file record on a storage location that does not exist', async () => {
		await expect(createFileRecord({ storage: 'missing' })).rejects.toMatchObject(invalidPayload);
	});

	test('rejects moving a file record onto a storage where its path points into the extensions directory', async () => {
		const name = `${randomUUID()}.js`;

		// Harmless in "secondary", but the same path lands in the extensions folder in "local"
		const file = await uploadToStorage('secondary', `extensions/${name}`);

		await expect(api.request(updateFile(file.id, { storage: 'local' }))).rejects.toMatchObject(forbidden);
	});

	test('rejects a multipart replacement that writes into the extensions directory', async () => {
		const name = `${randomUUID()}.js`;
		const file = await uploadToStorage('secondary', `extensions/${name}`);

		const form = new FormData();
		form.set('storage', 'local');
		form.set('file', new Blob([Buffer.from('replaced')], { type: 'text/javascript' }), name);

		await expect(api.request(updateFile(file.id, form))).rejects.toMatchObject(forbidden);

		expect(existsInExtensions(name)).toBe(false);
	});

	test('rejects a resumable replacement of a file stored in another location', async () => {
		const name = `${randomUUID()}.js`;

		// Resumable uploads always write to the first storage location, "local", where this path is the extensions folder
		const file = await uploadToStorage('secondary', `extensions/${name}`);

		const err = await uploadViaTus(Buffer.from('replaced'), {
			filename_download: name,
			type: 'text/javascript',
			id: file.id,
		}).catch((error) => error);

		expect(err).toBeInstanceOf(Error);
		expect(err.originalResponse?.getStatus()).toBe(400);

		expect(existsInExtensions(name)).toBe(false);
	});
});
