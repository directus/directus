import { join } from 'path';
import { sandbox } from '@directus/sandbox';
import {
	createCollection,
	createDirectus,
	createField,
	createItem,
	createItems,
	deleteCollection,
	deleteField,
	rest,
	staticToken,
	updateCollection,
	updateField,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { Signal } from '@utils/signal.js';
import { range } from 'lodash-es';
import { afterAll, expect, test } from 'vitest';

const collection = 'hook_artists';

const directus = await sandbox(database, {
	port: sandboxPort(),
	inspect: false,
	prefix: 'action-hooks',
	env: {
		// The hook in here registers on `hook_artists.items.create`
		EXTENSIONS_PATH: join(import.meta.dirname, 'hooks'),
		DB_FILENAME: `directus_test_${getUID()}.db`,
	},
	docker: {
		suffix: getUID(),
	},
});

const api = createDirectus<any>(`http://localhost:${directus.apis[0]!.port}`).with(rest()).with(staticToken('admin'));

const reported = new Signal<string[]>([]);

directus.logger.onLog((message) => {
	for (const line of message.split('\n')) {
		const start = line.search(/action-verify-(create|schema):/);
		if (start !== -1) reported.set([...reported.get(), line.slice(start)]);
	}
});

await api.request(
	createCollection({
		collection,
		fields: [
			{
				field: 'id',
				type: 'integer',
				meta: { hidden: true, interface: 'input', readonly: true },
				schema: { is_primary_key: true, has_auto_increment: true },
			},
			{ field: 'name', type: 'string' },
		],
		schema: {},
		meta: { singleton: false },
	}),
);

afterAll(async () => {
	await directus.stop();
});

test('the items.create action hook can read an item created one at a time', async () => {
	// Registered up front, since the hook may report before the request resolves
	const reports = reported.waitFor((all) => {
		const seen = all.filter((line) => line.includes(':one-'));
		return seen.length === 2 ? seen : undefined;
	});

	await api.request(createItem(collection, { name: 'one-a' }));
	await api.request(createItem(collection, { name: 'one-b' }));

	expect((await reports).every((line) => line.endsWith(':1'))).toBe(true);
});

test('the items.create action hook can read every item of a batch', async () => {
	const reports = reported.waitFor((all) => {
		const seen = all.filter((line) => line.includes(':many-'));
		return seen.length === 10 ? seen : undefined;
	});

	await api.request(
		createItems(
			collection,
			range(10).map((i) => ({ name: `many-${i}` })),
		),
	);

	expect((await reports).every((line) => line.endsWith(':1'))).toBe(true);
});

test('the schema action hooks already see the change that triggered them', async () => {
	const schemaCollection = 'hook_schema_items';

	const reports = reported.waitFor((all) => {
		const seen = all.filter((line) => line.startsWith('action-verify-schema:'));
		return seen.length === 6 ? seen : undefined;
	});

	await api.request(
		createCollection({
			collection: schemaCollection,
			fields: [
				{
					field: 'id',
					type: 'integer',
					meta: { hidden: true, interface: 'input', readonly: true },
					schema: { is_primary_key: true, has_auto_increment: true },
				},
			],
			schema: {},
			meta: { singleton: false },
		}),
	);

	await api.request(updateCollection(schemaCollection, { meta: { note: 'noted' } }));

	await api.request(createField(schemaCollection, { field: 'test_field', type: 'string' }));
	await api.request(updateField(schemaCollection, 'test_field', { meta: { note: 'noted' } }));
	await api.request(deleteField(schemaCollection, 'test_field'));

	await api.request(deleteCollection(schemaCollection));

	const lines = await reports;

	expect(lines.map((line) => line.split(':')[1])).toEqual([
		'collections.create',
		'collections.update',
		'fields.create',
		'fields.update',
		'fields.delete',
		'collections.delete',
	]);

	expect(lines.every((line) => line.endsWith(':1'))).toBe(true);
});
