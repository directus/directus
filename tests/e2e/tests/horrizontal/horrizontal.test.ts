import { type Database, sandbox } from '@directus/sandbox';
import { createDirectus, createItem, readItem, rest, serverHealth, staticToken } from '@directus/sdk';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { useSnapshot } from '@utils/useSnapshot.js';
import type { Schema } from './schema.d.ts';

const database = process.env['DATABASE'] as Database;
const all = process.env['ALL'] === 'true';

if (!all)
	test('running two instances', { timeout: 120_000 }, async () => {
		const directus = await sandbox(database, {
			port: String(Math.floor(Math.random() * 400 + 9000)),
			instances: '2',
			killPorts: true,
		});

		const api1 = createDirectus<Schema>(`http://localhost:${directus.env.PORT}`)
			.with(rest())
			.with(staticToken('admin'));

		const api2 = createDirectus<Schema>(`http://localhost:${Number(directus.env.PORT) + 2}`)
			.with(rest())
			.with(staticToken('admin'));

		const result1 = await api1.request(serverHealth());
		const result2 = await api2.request(serverHealth());

		expect(result1.status).toBe('ok');
		expect(result2.status).toBe('ok');

		const { collections } = await useSnapshot<Schema>(api1, join(import.meta.dirname, 'snapshot.json'));

		const item = await api2.request(
			createItem(collections.test, {
				text: 'Horrizontal',
			}),
		);

		const readResult = await api1.request(readItem(collections.test, item.id!));

		expect(readResult).toMatchObject({
			id: expect.anything(),
			text: 'Horrizontal',
		});

		await directus.stop();

		await expect(() => api1.request(serverHealth())).rejects.toThrowError();
		await expect(() => api2.request(serverHealth())).rejects.toThrowError();
	});
