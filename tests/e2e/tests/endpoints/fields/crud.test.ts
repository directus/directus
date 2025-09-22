import { createDirectus, createField, deleteField, readField, rest, staticToken, updateField } from '@directus/sdk';
import { useSnapshot } from '@utils/useSnapshot.js';
import { join } from 'path';
import type { Schema } from './schema.d.ts';
import { expect, test } from 'vitest';
import { randomUUID } from 'crypto';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

test('create field', async () => {
	const field = randomUUID().split('-')[0]!;

	const created = await api.request(
		createField(collections.fields, {
			field,
			type: 'string',
		}),
	);

	expect(created).toMatchObject({
		field,
		type: 'string',
		meta: null,
		schema: {
			is_nullable: true,
		},
	});

	const read = await api.request(readField(collections.fields, field));

	expect(read).toMatchObject({
		field,
		type: 'string',
		meta: null,
		schema: {
			is_nullable: true,
		},
	});

	const update = await api.request(updateField(collections.fields, field, { meta: { display: 'test' } }));

	expect(update).toMatchObject({
		field,
		type: 'string',
		meta: { display: 'test' },
		schema: {
			is_nullable: true,
		},
	});

	await api.request(deleteField(collections.fields, field));

	await expect(api.request(readField(collections.fields, field))).rejects.toThrowError();
});
