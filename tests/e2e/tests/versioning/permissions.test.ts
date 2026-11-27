import { randomUUID } from 'node:crypto';
import {
	createDirectus,
	createItem,
	createPolicy,
	createUser,
	readItem,
	readItems,
	rest,
	staticToken,
	updatePolicy,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { directusError } from '@utils/errors.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { snapshot } from './snapshot.js';
import { readVersion, SHADOW, useVersions } from './versions.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, snapshot);
const adminVersions = useVersions(api);

const token = randomUUID();

const user = await api.request(
	createUser({
		first_name: 'Test',
		last_name: 'Versioning',
		email: `${token}@versioning.com`,
		password: 'password',
		token,
	}),
);

const policy = await api.request(
	createPolicy({
		admin_access: false,
		app_access: false,
		name: 'Versioning Test Policy',
		users: [{ user: user.id }],
		permissions: [],
	}),
);

const userApi = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken(token));
const versions = useVersions(userApi);

const shadowPosts = SHADOW + collections.posts;
const ALL = ['create', 'read', 'update', 'delete'] as const;

type Action = (typeof ALL)[number];

function permission(collection: string, action: Action, options: Record<string, unknown> = {}) {
	return { collection, action, fields: ['*'], permissions: {}, validation: {}, presets: {}, ...options };
}

function permissions(collection: string, actions: readonly Action[] = ALL) {
	return actions.map((action) => permission(collection, action));
}

async function setPermissions(...list: Record<string, unknown>[]) {
	await api.request(updatePolicy(policy.id, { permissions: list as any }));
}

test('versions require permissions on the shadow collection', async () => {
	await setPermissions(...permissions(collections.posts));

	await expect(versions.create(collections.posts, { title: 'No access' })).rejects.toMatchObject(
		directusError('FORBIDDEN'),
	);

	await expect(userApi.request(readItems(collections.posts, { version: 'true' } as any))).rejects.toMatchObject(
		directusError('FORBIDDEN'),
	);

	// Live items are unaffected
	expect(await userApi.request(readItems(collections.posts))).toBeInstanceOf(Array);
});

test('creating versions applies the field permissions, validation and presets of the shadow collection', async () => {
	await setPermissions(
		...permissions(collections.posts),
		permission(shadowPosts, 'read'),
		permission(shadowPosts, 'create', {
			fields: ['title', 'views', 'version_name', 'version_user_created'],
			validation: { title: { _nnull: true } },
			presets: { views: 7 },
		}),
	);

	const draft = await versions.create(collections.posts, { title: 'Allowed' });

	expect(draft).toMatchObject({
		title: 'Allowed',
		views: 7,
		directus_version: { type: 'draft', user_created: user.id },
	});

	await expect(versions.create(collections.posts, { title: 'With author', author: null })).rejects.toMatchObject(
		directusError('FORBIDDEN'),
	);

	await expect(versions.create(collections.posts, { title: null, views: 1 })).rejects.toMatchObject(
		directusError('FAILED_VALIDATION'),
	);
});

test('updating and deleting versions require the matching shadow permissions', async () => {
	await setPermissions(...permissions(collections.posts), ...permissions(shadowPosts, ['create', 'read']));

	const draft = await versions.create(collections.posts, { title: 'Change me' });
	const versionId = draft.directus_version.id;

	await expect(versions.update(collections.posts, versionId, { title: 'Changed' })).rejects.toMatchObject(
		directusError('FORBIDDEN'),
	);

	await expect(versions.delete(collections.posts, versionId)).rejects.toMatchObject(directusError('FORBIDDEN'));

	await setPermissions(...permissions(collections.posts), ...permissions(shadowPosts));

	expect(await versions.update(collections.posts, versionId, { title: 'Changed' })).toMatchObject({ title: 'Changed' });

	await versions.delete(collections.posts, versionId);

	expect(await readVersion(api, collections.posts, versionId)).toBeUndefined();
});

test('item permissions of the shadow collection restrict which versions can be changed', async () => {
	await setPermissions(
		...permissions(collections.posts),
		...permissions(shadowPosts, ['create', 'read']),
		permission(shadowPosts, 'update', { permissions: { version_user_created: { _eq: '$CURRENT_USER' } } }),
	);

	const foreign = await adminVersions.create(collections.posts, { title: 'Created by admin' });
	const own = await versions.create(collections.posts, { title: 'Created by user' });

	await expect(
		versions.update(collections.posts, foreign.directus_version.id, { title: 'Hijacked' }),
	).rejects.toMatchObject(directusError('FORBIDDEN'));

	expect(await versions.update(collections.posts, own.directus_version.id, { title: 'Edited' })).toMatchObject({
		title: 'Edited',
	});
});

test('publishing requires permissions on the live collection', async () => {
	await setPermissions(...permissions(collections.posts, ['read']), ...permissions(shadowPosts));

	const draft = await versions.create(collections.posts, { title: 'Publish me' });

	await expect(versions.publish(collections.posts, draft.directus_version.id)).rejects.toMatchObject(
		directusError('FORBIDDEN'),
	);

	expect(await readVersion(api, collections.posts, draft.directus_version.id, ['id', 'directus_version.type'])).toEqual(
		{
			id: null,
			directus_version: { type: 'draft' },
		},
	);

	await setPermissions(...permissions(collections.posts, ['read', 'create']), ...permissions(shadowPosts));

	const { id } = await versions.publish(collections.posts, draft.directus_version.id);

	expect(await userApi.request(readItem(collections.posts, id))).toMatchObject({ title: 'Publish me' });
});

test('linking live items mirrors the permissions of the related collection', async () => {
	const link = await api.request(createItem(collections.links, { url: 'link.com' }));
	const note = await api.request(createItem(collections.notes, { text: 'Note' }));

	// Links aren't versioned, so linking them requires updating them
	await setPermissions(
		...permissions(collections.posts),
		...permissions(shadowPosts),
		...permissions(collections.links, ['read']),
		...permissions(collections.notes),
	);

	const draft = await versions.create(collections.posts, { title: 'Linking' });
	const versionId = draft.directus_version.id;

	await expect(versions.update(collections.posts, versionId, { links: [link.id] })).rejects.toMatchObject(
		directusError('FORBIDDEN'),
	);

	// Notes are versioned, so linking them mirrors the permissions of their shadow collection
	await expect(versions.update(collections.posts, versionId, { notes: [note.id] })).rejects.toMatchObject(
		directusError('FORBIDDEN'),
	);

	await setPermissions(
		...permissions(collections.posts),
		...permissions(shadowPosts),
		...permissions(collections.links, ['read', 'update']),
		...permissions(collections.notes),
		...permissions(SHADOW + collections.notes, ['read', 'update']),
	);

	await versions.update(collections.posts, versionId, { links: [link.id], notes: [note.id] });

	expect(await readVersion(userApi, collections.posts, versionId, ['links.url', 'notes.text'])).toEqual({
		links: [{ url: 'link.com' }],
		notes: [{ text: 'Note' }],
	});
});

test('reading versions applies the item permissions of the live collection', async () => {
	await adminVersions.create(collections.posts, { title: 'Hidden draft' });
	await adminVersions.create(collections.posts, { title: 'Visible draft' });

	await setPermissions(
		permission(collections.posts, 'read', { permissions: { title: { _ncontains: 'Hidden' } } }),
		permission(shadowPosts, 'read'),
	);

	const titles = (
		await userApi.request(readItems(collections.posts, { version: 'true', fields: ['title'], limit: -1 } as any))
	).map((item: any) => item.title);

	expect(titles).toContain('Visible draft');
	expect(titles).not.toContain('Hidden draft');
});
