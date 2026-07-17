import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import type { RelationM2O } from './use-relation-m2o';
import { type RelationQuerySingle, useRelationSingle } from './use-relation-single';
import sdk from '@/sdk';
import { unexpectedError } from '@/utils/unexpected-error';

vi.mock('@/sdk', async () => {
	const { mockSdk } = await import('@/test-utils/sdk');
	return mockSdk();
});

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

afterEach(() => {
	vi.clearAllMocks();
});

const relation: RelationM2O = {
	relation: {
		collection: 'test-collection',
		field: 'related_id',
		related_collection: 'related-collection',
		meta: null,
		schema: null,
	},
	relatedCollection: {
		collection: 'related-collection',
		name: 'Related Collection',
		icon: 'box',
		meta: null,
		schema: null,
		type: 'table',
	},
	relatedPrimaryKeyField: {
		collection: 'related-collection',
		field: 'id',
		name: 'ID',
		type: 'uuid',
		meta: null,
		schema: null,
	},
	type: 'm2o',
};

const TestComponent = defineComponent({
	props: ['value'], // eslint-disable-line vue/require-prop-types
	setup(props) {
		const value = ref(props.value);
		const query = computed<RelationQuerySingle>(() => ({ fields: ['name'] }));

		return {
			...useRelationSingle(value, query, ref(relation)),
		};
	},
	render: () => h('div'),
});

describe('useRelationSingle', () => {
	test('displays the related item returned by the API', async () => {
		vi.mocked(sdk.request).mockResolvedValueOnce({ id: 'tenant-a', name: 'Tenant A' });

		const wrapper = mount(TestComponent, {
			props: {
				value: 'tenant-a',
			},
		});

		await flushPromises();

		expect(sdk.request).toHaveBeenCalledOnce();
		expect(wrapper.vm.displayItem).toEqual({ id: 'tenant-a', name: 'Tenant A' });
	});

	test('falls back to the scalar primary key when the related item is forbidden', async () => {
		vi.mocked(sdk.request).mockRejectedValueOnce({ response: { status: 403 } });

		const wrapper = mount(TestComponent, {
			props: {
				value: 'tenant-a',
			},
		});

		await flushPromises();

		expect(wrapper.vm.displayItem).toEqual({ id: 'tenant-a' });
		expect(unexpectedError).not.toHaveBeenCalled();
	});
});
