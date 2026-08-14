import { assertType, describe, expectTypeOf, test } from 'vitest';
import type { DirectusFlow, DirectusPreset, DirectusVersion, NestedPartial } from '../src/index.js';
import { createComment, createContentVersion, createDirectus, createPreset, rest } from '../src/index.js';
import type { TestSchema } from './schema.js';

describe('NestedPartial', () => {
	test('collection-name fields still accept an arbitrary string (comment)', () => {
		const client = createDirectus<TestSchema>('http://localhost:8055').with(rest());
		const collection: string = 'collection_c';

		client.request(createComment({ collection, item: '1', comment: 'hi' }));
	});

	test('collection-name fields still accept an arbitrary string (preset, nullable)', () => {
		const client = createDirectus<TestSchema>('http://localhost:8055').with(rest());
		const collection: string = 'collection_c';

		client.request(createPreset({ collection }));
	});

	test('collection-name fields still accept an arbitrary string (version)', () => {
		const client = createDirectus<TestSchema>('http://localhost:8055').with(rest());
		const collection: string = 'collection_c';

		client.request(createContentVersion({ collection, key: 'draft' }));
	});

	test('StringLiteralUnion fields keep their literal members (status)', () => {
		type FlowParam = NestedPartial<DirectusFlow<TestSchema>>;

		// If this were widened to plain `string`, it would equal `string | undefined`.
		expectTypeOf<FlowParam['status']>().not.toEqualTypeOf<string | undefined>();

		assertType<FlowParam>({ status: 'active' });
		assertType<FlowParam>({ status: 'some-custom-status' });
	});

	test('StringLiteralUnion fields keep their literal members when nullable (trigger, accountability)', () => {
		type FlowParam = NestedPartial<DirectusFlow<TestSchema>>;

		expectTypeOf<FlowParam['trigger']>().not.toEqualTypeOf<string | null | undefined>();
		expectTypeOf<FlowParam['accountability']>().not.toEqualTypeOf<string | null | undefined>();

		assertType<FlowParam>({ trigger: 'schedule', accountability: 'all' });
		assertType<FlowParam>({ trigger: null, accountability: null });
	});

	test('StringLiteralUnion fields keep their literal members when nullable (preset collection)', () => {
		type PresetParam = NestedPartial<DirectusPreset<TestSchema>>;

		expectTypeOf<PresetParam['collection']>().not.toEqualTypeOf<string | null | undefined>();

		assertType<PresetParam>({ collection: 'collection_c' });
		assertType<PresetParam>({ collection: null });
	});

	test('StringLiteralUnion fields keep their literal members (version collection)', () => {
		type VersionParam = NestedPartial<DirectusVersion<TestSchema>>;

		expectTypeOf<VersionParam['collection']>().not.toEqualTypeOf<string | undefined>();

		assertType<VersionParam>({ collection: 'collection_c' });
	});
});
