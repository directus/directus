import { randomUUID } from 'crypto';
import {
	createDirectus,
	createFolder,
	createFolders,
	createUser,
	deleteFolders,
	readFolders,
	rest,
	staticToken,
	updateFolder,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { afterEach, expect, test } from 'vitest';

const token = randomUUID();

const adminApi = createDirectus<unknown>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

await adminApi.request(
	createUser({
		first_name: 'Test',
		last_name: 'User',
		email: `${randomUUID()}@test.com`,
		password: 'secret',
		token,
		policies: [
			{
				policy: {
					name: 'Folders Permissions',
					permissions: [
						{ collection: 'directus_folders', action: 'create', fields: ['*'] },
						{ collection: 'directus_folders', action: 'read', fields: ['*'] },
						{ collection: 'directus_folders', action: 'update', fields: ['*'] },
						{ collection: 'directus_folders', action: 'delete', fields: ['*'] },
					],
				},
			},
		],
	}),
);

afterEach(async () => {
	const folders = await adminApi.request(readFolders({ fields: ['id'] }));

	if (folders.length === 0) return;

	adminApi.request(deleteFolders(folders.map((folder) => folder.id)));
});

const userApi = createDirectus<unknown>(`http://localhost:${port}`).with(rest()).with(staticToken(token));

test('create a file folder as admin', async () => {
	const folder = await adminApi.request(createFolder({ name: 'Test' }));

	expect(folder).toMatchObject({
		name: 'Test',
		type: 'files',
	});
});

test('create a file folder as user', async () => {
	const folder = await userApi.request(createFolder({ name: 'Test 2' }));

	expect(folder).toMatchObject({
		name: 'Test 2',
		type: 'files',
	});
});

test('create a flow folder as admin', async () => {
	const folder = await adminApi.request(createFolder({ name: 'Test', type: 'flows' }));

	expect(folder).toMatchObject({
		name: 'Test',
	});
});

test('create a flow folder as user', async () => {
	await expect(
		async () => await userApi.request(createFolder({ name: 'Test 2', type: 'flows' })),
	).rejects.toThrowErrorMatchingInlineSnapshot(`[RequestError: Invalid payload. Cannot create a flows folder.]`);
});

test('read folders as admin', async () => {
	const folders = await adminApi.request(
		createFolders([
			{ name: 'Test 1', type: 'flows' },
			{ name: 'Test 2', type: 'files' },
			{ name: 'Test 3', type: 'files' },
		]),
	);

	const result = await adminApi.request(readFolders());

	expect(result).toEqual(folders);
});

test('read folders as user', async () => {
	const folders = await adminApi.request(
		createFolders([
			{ name: 'Test 1', type: 'flows' },
			{ name: 'Test 2', type: 'files' },
			{ name: 'Test 3', type: 'files' },
		]),
	);

	const result = await userApi.request(readFolders());

	// Only show files folders to normal users
	expect(result).toEqual(folders.filter((folder) => folder.type === 'files'));
});

test('update a folder as admin', async () => {
	const folder = await adminApi.request(createFolder({ name: 'Test 2', type: 'files' }));

	const result = await adminApi.request(updateFolder(folder.id, { name: 'Test 2 Updated', type: 'flows' }));

	expect(result).toEqual({ id: folder.id, name: 'Test 2 Updated', type: 'flows', parent: null });
});

test('update a files folder as user', async () => {
	const folder = await adminApi.request(createFolder({ name: 'Test 2', type: 'files' }));

	const result = await userApi.request(updateFolder(folder.id, { name: 'Test 2 Updated' }));

	expect(result).toEqual({ id: folder.id, name: 'Test 2 Updated', type: 'files', parent: null });
});

test('update a files folder to a flows one as user', async () => {
	const folder = await adminApi.request(createFolder({ name: 'Test 2', type: 'files' }));

	await expect(async () => {
		await userApi.request(updateFolder(folder.id, { type: 'flows' }));
	}).rejects.toThrowErrorMatchingInlineSnapshot(
		`[RequestError: Invalid payload. Cannot change a folder into a flows folder.]`,
	);
});

test('delete folders as user', async () => {
	const folders = await adminApi.request(
		createFolders(
			[
				{ name: 'Test 1', type: 'files' },
				{ name: 'Test 2', type: 'flows' },
			],
			{ sort: ['name'] },
		),
	);

	const result = await userApi.request(deleteFolders([folders[0]!.id]));

	expect(result).toBeDefined();

	await expect(async () => {
		await userApi.request(deleteFolders([folders[1]!.id]));
	}).rejects.toThrowErrorMatchingInlineSnapshot(`[RequestError: Invalid payload. Cannot delete a flows folder.]`);
});
