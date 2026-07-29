import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { sandbox } from '@directus/sandbox';
import {
	createDirectus,
	createPolicy,
	createUser,
	deleteFile,
	type DirectusClient,
	readAssetArrayBuffer,
	readFiles,
	rest,
	type RestClient,
	staticToken,
	updatePolicy,
	uploadFiles,
} from '@directus/sdk';
import type { Permission } from '@directus/types';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
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
	const form = new FormData();
	form.set('storage', 'local');
	form.set('filename_disk', filenameDisk);
	form.set('file', new Blob([Buffer.from('forbidden-path-test')], { type: 'application/octet-stream' }), 'file.bin');

	const result = await api.request<{ id: string }>(uploadFiles(form));
	uploadedIds.push(result.id);
	return result;
}

beforeAll(async () => {
	directus = await sandbox(database, {
		inspect: false,
		prefix: `files-sb-${getUID()}`,
		env: {
			TUS_ENABLED: 'true',
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
});

describe('POST /files forbidden storage paths', () => {
	test('rejects an upload that writes into the extensions directory', async () => {
		await expect(uploadToLocal('extensions/evil.js')).rejects.toMatchObject({
			errors: [expect.objectContaining({ extensions: expect.objectContaining({ code: 'FORBIDDEN' }) })],
		});
	});

	test('rejects an upload that writes into the temp directory', async () => {
		await expect(uploadToLocal('temp/evil.js')).rejects.toMatchObject({
			errors: [expect.objectContaining({ extensions: expect.objectContaining({ code: 'FORBIDDEN' }) })],
		});
	});

	test('allows an upload to a sibling folder that merely shares the extensions prefix', async () => {
		const upload = await uploadToLocal('extensions-backup/image.jpg');

		expect(upload.id).toBeDefined();
	});
});
