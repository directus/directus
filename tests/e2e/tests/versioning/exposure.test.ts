import {
	createDirectus,
	createFlow,
	createItem,
	createOperation,
	graphql,
	readFields,
	readFieldsByCollection,
	readItems,
	readOpenApiSpec,
	readRelationByCollection,
	readRelations,
	rest,
	staticToken,
	triggerFlow,
	updateFlow,
	utilsExport,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { openAuthenticatedSocket } from '@utils/websocket.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { snapshot } from './snapshot.js';
import { knex, LINK, SHADOW } from './versions.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));

const { collections } = await useSnapshot<Schema>(api, snapshot);

const shadow = SHADOW + collections.posts;
const SECRET = 'shadow secret';

const isVersionTable = (name: string) => name.startsWith(SHADOW) || name.startsWith(LINK);

beforeAll(async () => {
	// A version row, so a leak would show up as data instead of an empty result
	await knex(shadow).insert({ title: SECRET });
});

afterAll(async () => {
	await knex.destroy();
});

describe('REST', () => {
	test('fields of version tables are hidden', async () => {
		const fields = await api.request(readFields());

		expect(fields.filter((field: { collection: string }) => isVersionTable(field.collection))).toEqual([]);
		await expect(api.request(readFieldsByCollection(shadow))).rejects.toBeDefined();
	});

	test('relations of version tables are hidden', async () => {
		const relations = await api.request(readRelations());

		expect(relations.filter((relation: { collection: string }) => isVersionTable(relation.collection))).toEqual([]);
		await expect(api.request(readRelationByCollection(shadow))).rejects.toBeDefined();
	});

	test('items of version tables can not be read or created', async () => {
		await expect(api.request(readItems(shadow as any))).rejects.toBeDefined();
		await expect(api.request(createItem(shadow as any, { title: 'injected' }))).rejects.toBeDefined();

		expect(await knex(shadow).where({ title: 'injected' })).toEqual([]);
	});

	test('version tables are left out of the OpenAPI spec', async () => {
		const spec = await api.request(readOpenApiSpec());

		expect(Object.keys(spec['paths']).filter((path) => path.includes(SHADOW) || path.includes(LINK))).toEqual([]);
	});
});

describe('import / export', () => {
	test('version tables can not be exported', async () => {
		await expect(api.request(utilsExport(shadow as any, 'json', {}, {}))).rejects.toBeDefined();
	});

	test('version tables can not be imported into', async () => {
		const form = () => {
			const form = new FormData();

			form.append(
				'file',
				new Blob([JSON.stringify([{ collection: shadow, items: [{ title: 'imported' }] }])], {
					type: 'application/json',
				}),
				'import.json',
			);

			return form;
		};

		const single = new FormData();
		single.append('file', new Blob([JSON.stringify([{ title: 'imported' }])], { type: 'application/json' }), 'a.json');

		for (const [path, body] of [
			[`/utils/import/${shadow}`, single],
			['/utils/import', form()],
		] as const) {
			const response = await fetch(`http://localhost:${port}${path}`, {
				method: 'POST',
				headers: { Authorization: 'Bearer admin' },
				body,
			});

			expect(response.ok, path).toBe(false);
		}

		expect(await knex(shadow).where({ title: 'imported' })).toEqual([]);
	});
});

describe('GraphQL', () => {
	test('version tables are not part of the schema', async () => {
		await expect(api.query(`query { ${shadow} { title } }`)).rejects.toBeDefined();

		const { __schema } = await api.query<{ __schema: { types: { name: string }[] } }>(
			`query { __schema { types { name } } }`,
		);

		expect(__schema.types.filter((type) => isVersionTable(type.name))).toEqual([]);
	});
});

describe('WebSockets', () => {
	test('version tables can not be read or subscribed to', async () => {
		const socket = await openAuthenticatedSocket(`ws://localhost:${port}/websocket`, 'admin');

		try {
			socket.send({ type: 'items', collection: shadow, action: 'read', uid: 'read' });

			const read = await socket.next((message) => message.uid === 'read');

			expect(read.status).toBe('error');
			expect(JSON.stringify(read)).not.toContain(SECRET);

			socket.send({ type: 'subscribe', collection: shadow, uid: 'subscribe' });

			const subscribe = await socket.next((message) => message.uid === 'subscribe');

			expect(subscribe.status).toBe('error');
			expect(JSON.stringify(subscribe)).not.toContain(SECRET);
		} finally {
			socket.close();
		}
	});
});

describe('flows', () => {
	test('operations can not read version tables', async () => {
		const flow = await api.request(createFlow({ name: 'read version table', trigger: 'webhook', options: {} }));

		const operation = await api.request(
			createOperation({
				flow: flow.id,
				key: 'read_shadow',
				name: 'Read shadow',
				type: 'item-read',
				position_x: 19,
				position_y: 1,
				options: { collection: shadow, query: { fields: ['*'] } },
			}),
		);

		await api.request(updateFlow(flow.id, { operation: operation.id }));

		const result = await api.request(triggerFlow('GET', flow.id)).catch((error) => error);

		expect(JSON.stringify(result ?? null)).not.toContain(SECRET);
	});
});
