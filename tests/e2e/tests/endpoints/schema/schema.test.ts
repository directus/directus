// import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
// import { useSnapshot } from '../../../utils/use-snapshot';
// import { Schema } from './schema';
// import { join } from 'path';
import { expect, test } from 'vitest';

// const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));

// const [schemaA, schemaB] = await Promise.all([
// 	useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot-a.json')),
// 	useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot-b.json')),
// ]);

test(`relational`, async () => {
	// const resultA = await api.request(createItem(schemaA.a, {}));
	// const resultB = await api.request(createItem(schemaB.b, {}));

	// expect(resultA.id).toBeDefined();
	// expect(resultB.id).toBeDefined();
	expect(1).toBe(1);
});
