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

	test('does not request the temporary "+" primary key of an unsaved parent item', async () => {
		const wrapper = mount(TestComponent, {
			props: {
				value: '+',
			},
		});

		await flushPromises();

		expect(sdk.request).not.toHaveBeenCalled();
		expect(wrapper.vm.displayItem).toBeNull();
		expect(unexpectedError).not.toHaveBeenCalled();
	});

	test('displays edits staged against an unsaved parent item', async () => {
		const wrapper = mount(TestComponent, {
			props: {
				value: '+',
			},
		});

		await flushPromises();

		wrapper.vm.update({ name: 'Typed Name' });

		await flushPromises();

		expect(sdk.request).not.toHaveBeenCalled();
		expect(wrapper.vm.displayItem).toEqual({ id: '+', name: 'Typed Name' });
		expect(unexpectedError).not.toHaveBeenCalled();
	});

	test('falls back to the scalar primary key when the related item is forbidden', async () => {
		vi.mocked(sdk.request).mockRejectedValueOnce({ errors: [{ extensions: { code: 'FORBIDDEN' } }] });

		const wrapper = mount(TestComponent, {
			props: {
				value: 'tenant-a',
			},
		});

		await flushPromises();

		expect(wrapper.vm.displayItem).toEqual({ id: 'tenant-a' });
		expect(unexpectedError).not.toHaveBeenCalled();
	});

	test('keeps the existing object value when the related item is forbidden', async () => {
		vi.mocked(sdk.request).mockRejectedValueOnce({ errors: [{ extensions: { code: 'FORBIDDEN' } }] });

		const wrapper = mount(TestComponent, {
			props: {
				value: { id: 'tenant-a', name: 'Typed Name' },
			},
		});

		await flushPromises();

		expect(wrapper.vm.displayItem).toEqual({ id: 'tenant-a', name: 'Typed Name' });
		expect(unexpectedError).not.toHaveBeenCalled();
	});

	test('surfaces errors that are not forbidden', async () => {
		vi.mocked(sdk.request).mockRejectedValueOnce({ errors: [{ extensions: { code: 'INTERNAL_SERVER_ERROR' } }] });

		const wrapper = mount(TestComponent, {
			props: {
				value: 'tenant-a',
			},
		});

		await flushPromises();

		expect(unexpectedError).toHaveBeenCalledOnce();
		expect(wrapper.vm.displayItem).toBeNull();
	});
});
