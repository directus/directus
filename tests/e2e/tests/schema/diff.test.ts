import {
	createCollection,
	createDirectus,
	deleteCollection,
	rest,
	schemaDiff,
	schemaSnapshot,
	type SchemaSnapshotOutput,
	staticToken,
} from '@directus/sdk';
import { port } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const alpha = `${getUID()}_alpha`;
const beta = `${getUID()}_beta`;
const gamma = `${getUID()}_gamma`;

const createTable = (collection: string) => api.request(createCollection({ collection, schema: {}, meta: {} }));

let snapshotWithAlpha: SchemaSnapshotOutput;
let partialGamma: SchemaSnapshotOutput;

beforeAll(async () => {
	// Snapshot with only `alpha`, then swap the live schema to only `beta`, so the diff has a create for
	// `alpha` and a delete for `beta`.
	await createTable(alpha);
	snapshotWithAlpha = await api.request(schemaSnapshot());
	await api.request(deleteCollection(alpha));
	await createTable(beta);

	// Partial snapshot scoped to `gamma`, captured before `gamma` is dropped from the live schema.
	await createTable(gamma);
	partialGamma = await api.request(schemaSnapshot({ includeCollections: [gamma] }));
	await api.request(deleteCollection(gamma));
});

afterAll(async () => {
	await api.request(deleteCollection(alpha)).catch(() => {});
	await api.request(deleteCollection(beta)).catch(() => {});
	await api.request(deleteCollection(gamma)).catch(() => {});
});

const collectionDiff = (diff: any, collection: string) =>
	diff.collections.find((entry: any) => entry.collection === collection);

describe('POST /schema/diff', () => {
	describe('mode', () => {
		test('should return both create and delete operations in mirror mode', async () => {
			const { diff } = await api.request(schemaDiff(snapshotWithAlpha, { force: true }));

			expect(collectionDiff(diff, alpha)?.diff[0].kind).toBe('N');
			expect(collectionDiff(diff, beta)?.diff[0].kind).toBe('D');
		});

		test('should exclude delete operations while keeping creates in merge mode', async () => {
			const { diff } = await api.request(schemaDiff(snapshotWithAlpha, { force: true, mode: 'merge' }));

			expect(collectionDiff(diff, alpha)?.diff[0].kind).toBe('N');
			expect(collectionDiff(diff, beta)).toBeUndefined();
		});
	});

	describe('partial snapshot', () => {
		test('should scope the diff to the snapshot collections, leaving others untouched', async () => {
			const { diff } = await api.request(schemaDiff(partialGamma));

			expect(collectionDiff(diff, gamma)?.diff[0].kind).toBe('N');
			expect(collectionDiff(diff, beta)).toBeUndefined();
		});
	});

	describe('force query parameter', () => {
		// Built at call time so `snapshotWithAlpha` is populated by `beforeAll` before it's read.
		const postMismatched = (query: string) =>
			fetch(`http://localhost:${port}/schema/diff${query}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: 'Bearer admin' },
				body: JSON.stringify({ ...snapshotWithAlpha, directus: '0.0.0' }),
			});

		test('should bypass a version mismatch for a bare `?force`', async () => {
			expect((await postMismatched('?force')).status).toBe(200);
		});

		test('should not bypass a version mismatch for an explicit `?force=false`', async () => {
			expect((await postMismatched('?force=false')).status).toBe(400);
		});
	});
});
