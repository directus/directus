import { describe, expect, test } from 'vitest';
import type { Collection } from '../types/collection.js';
import type {
	Snapshot,
	SnapshotDiff,
	SnapshotDiffWithHash,
	SnapshotField,
	SnapshotRelation,
	SnapshotWithHash,
} from '../types/snapshot.js';
import { validateApplyDiff } from './validate-diff.js';

test('should fail on invalid diff schema', () => {
	const diff = {} as SnapshotDiffWithHash;
	const snapshot = {} as SnapshotWithHash;

	expect(() => validateApplyDiff(diff, snapshot)).toThrowError('"hash" is required');
});

test('should fail on invalid hash', () => {
	const diff = {
		hash: 'abc',
		diff: { collections: [{ collection: 'test', diff: [] }], fields: [], relations: [] },
	} as SnapshotDiffWithHash;

	const snapshot = { hash: 'xyz' } as SnapshotWithHash;

	expect(() => validateApplyDiff(diff, snapshot)).toThrowError(
		"Provided hash does not match the current instance's schema hash"
	);
});

describe('should throw accurate error', () => {
	const baseDiff = (partialDiff: Partial<SnapshotDiff>): SnapshotDiffWithHash => {
		return {
			hash: 'abc',
			diff: {
				fields: [],
				collections: [],
				relations: [],
				...partialDiff,
			},
		};
	};

	const baseSnapshot = (partialSnapshot?: Partial<Snapshot>) => {
		return {
			hash: 'xyz',
			collections: [] as Collection[],
			fields: [] as SnapshotField[],
			relations: [] as SnapshotRelation[],
			...partialSnapshot,
		} as SnapshotWithHash;
	};

	test('creating collection which already exists', () => {
		const diff = baseDiff({
			collections: [{ collection: 'test', diff: [{ kind: 'N', rhs: {} as Collection }] }],
		});

		const snapshot = baseSnapshot({ collections: [{ collection: 'test' } as Collection] });

		expect(() => validateApplyDiff(diff, snapshot)).toThrowError(
			'Provided diff is trying to create collection "test" but it already exists'
		);
	});

	test('deleting collection which does not exist', () => {
		const diff = baseDiff({
			collections: [{ collection: 'test', diff: [{ kind: 'D', lhs: {} as Collection }] }],
		});

		expect(() => validateApplyDiff(diff, baseSnapshot())).toThrowError(
			'Provided diff is trying to delete collection "test" but it does not exist'
		);
	});

	test('creating field which already exists', () => {
		const diff = baseDiff({
			fields: [{ collection: 'test', field: 'test', diff: [{ kind: 'N', rhs: {} as SnapshotField }] }],
		});

		const snapshot = baseSnapshot({ fields: [{ collection: 'test', field: 'test' } as SnapshotField] });

		expect(() => validateApplyDiff(diff, snapshot)).toThrowError(
			'Provided diff is trying to create field "test.test" but it already exists'
		);
	});

	test('deleting field which does not exist', () => {
		const diff = baseDiff({
			fields: [{ collection: 'test', field: 'test', diff: [{ kind: 'D', lhs: {} as SnapshotField }] }],
		});

		expect(() => validateApplyDiff(diff, baseSnapshot())).toThrowError(
			'Provided diff is trying to delete field "test.test" but it does not exist'
		);
	});

	test('creating relation which already exists', () => {
		const diff = baseDiff({
			relations: [
				{
					collection: 'test',
					field: 'test',
					related_collection: 'relation',
					diff: [{ kind: 'N', rhs: {} as SnapshotRelation }],
				},
			],
		});

		const snapshot = baseSnapshot({
			relations: [{ collection: 'test', field: 'test', related_collection: 'relation' } as SnapshotRelation],
		});

		expect(() => validateApplyDiff(diff, snapshot)).toThrowError(
			'Provided diff is trying to create relation "test.test-> relation" but it already exists'
		);
	});

	test('deleting relation which does not exist', () => {
		const diff = baseDiff({
			relations: [
				{
					collection: 'test',
					field: 'test',
					related_collection: 'relation',
					diff: [{ kind: 'D', lhs: {} as SnapshotRelation }],
				},
			],
		});

		expect(() => validateApplyDiff(diff, baseSnapshot())).toThrowError(
			'Provided diff is trying to delete relation "test.test-> relation" but it does not exist'
		);
	});
});

test('should not throw error for diffs with varying types of lhs/rhs', () => {
	const diff: any = {
		hash: 'abc',
		diff: {
			collections: [
				{
					collection: 'a',
					diff: [
						{
							kind: 'E',
							path: ['meta', 'color'],
							lhs: null,
							rhs: '#6644FF',
						},
					],
				},
				{
					collection: 'a',
					diff: [
						{
							kind: 'A',
							path: ['meta', 'translations'],
							index: 1,
							item: {
								kind: 'N',
								rhs: {
									language: 'de-DE',
									translation: 'Collection A de-DE',
								},
							},
						},
					],
				},
				{
					collection: 'b',
					diff: [
						{
							kind: 'E',
							path: ['meta', 'translations', 1, 'language'],
							lhs: 'es-ES',
							rhs: 'nl-NL',
						},
						{
							kind: 'E',
							path: ['meta', 'translations', 1, 'translation'],
							lhs: 'nombre',
							rhs: 'naam',
						},
					],
				},
			],
			fields: [
				{
					collection: 'a',
					field: 'new_field',
					diff: [
						{
							kind: 'N',
							rhs: {
								collection: 'a',
								field: 'new_field',
								type: 'string',
								meta: {},
								schema: {},
							},
						},
					],
				},
				{
					collection: 'a',
					field: 'update_field',
					diff: [
						{
							kind: 'E',
							path: ['meta', 'options'],
							lhs: {
								iconLeft: 'check_circle',
							},
							rhs: null,
						},
					],
				},
				{
					collection: 'a',
					field: 'delete_field',
					diff: [
						{
							kind: 'D',
							lhs: {
								collection: 'a',
								field: 'delete_field',
								type: 'string',
								meta: {},
								schema: {},
							},
						},
					],
				},
			],
			relations: [
				{
					collection: 'a',
					field: 'm2o',
					related_collection: 'b',
					diff: [
						{
							kind: 'E',
							path: ['schema', 'on_delete'],
							lhs: 'SET NULL',
							rhs: 'CASCADE',
						},
					],
				},
			],
		},
	};

	const snapshot = { hash: 'abc' } as SnapshotWithHash;

	expect(() => validateApplyDiff(diff, snapshot)).not.toThrow();
});

test('should not throw error for relation diff with null related_collection (applicable for M2A junction tables)', () => {
	const diff: any = {
		hash: 'abc',
		diff: {
			collections: [],
			fields: [],
			relations: [
				{
					collection: 'pages_blocks',
					field: 'item',
					related_collection: null,
					diff: [
						{
							kind: 'N',
							rhs: {
								collection: 'pages_blocks',
								field: 'item',
								related_collection: null,
								meta: {
									junction_field: 'pages_id',
									many_collection: 'pages_blocks',
									many_field: 'item',
									one_allowed_collections: ['a', 'b'],
									one_collection: null,
									one_collection_field: 'collection',
									one_deselect_action: 'nullify',
									one_field: null,
									sort_field: null,
								},
							},
						},
					],
				},
			],
		},
	};

	const snapshot = { hash: 'abc' } as SnapshotWithHash;

	expect(() => validateApplyDiff(diff, snapshot)).not.toThrow();
});

test('should detect empty diff', () => {
	const diff = {
		hash: 'abc',
		diff: { collections: [], fields: [], relations: [] },
	};

	const snapshot = {} as SnapshotWithHash;

	expect(validateApplyDiff(diff, snapshot)).toBe(false);
});

test('should pass on valid diff', () => {
	const diff = {
		hash: 'abc',
		diff: { collections: [{ collection: 'test', diff: [] }], fields: [], relations: [] },
	};

	const snapshot = { hash: 'abc' } as SnapshotWithHash;

	expect(validateApplyDiff(diff, snapshot)).toBe(true);
});
