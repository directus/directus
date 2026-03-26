import { sandbox } from '@directus/sandbox';
import { createDirectus, createItem, readItem, rest, serverHealth, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { useSnapshot } from '@utils/useSnapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.js';

const all = process.env['ALL'] === 'true';

if (!all)
	test('running two instances', { timeout: 120_000 }, async () => {
		const directus = await sandbox(database, {
			instances: '2',
			inspect: false,
			silent: true,
			env: {
				LOG_LEVEL: 'debug',
			},
			extras: {
				redis: true,
			},
			docker: {
				suffix: getUID(),
			},
		});

		const api1 = createDirectus<Schema>(`http://localhost:${directus.apis[0].port}`)
			.with(rest())
			.with(staticToken('admin'));

		const api2 = createDirectus<Schema>(`http://localhost:${directus.apis[1]!.port}`)
			.with(rest())
			.with(staticToken('admin'));

		const result1 = await api1.request(serverHealth());
		const result2 = await api2.request(serverHealth());

		expect(result1.status).toBe('ok');
		expect(result2.status).toBe('ok');

		const { collections } = await useSnapshot<Schema>(api1);

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
