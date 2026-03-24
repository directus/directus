import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import InputGroup from './input-group.vue';

vi.mock('@directus/composables', () => ({
	useCollection: () => ({ info: computed(() => null) }),
}));

vi.mock('@/composables/use-fake-version-field', () => ({
	useFakeVersionField: () => ({ fakeVersionField: computed(() => undefined) }),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getField: () => ({
			type: 'string',
			meta: {},
		}),
	}),
}));

vi.mock('@/stores/relations', () => ({
	useRelationsStore: () => ({
		getRelationsForField: () => [],
	}),
}));

describe('InputGroup', () => {
	it('keeps raw dynamic-variable strings for _in filters', async () => {
		const wrapper = mount(InputGroup, {
			props: {
				field: {
					country: {
						_in: '$CURRENT_USER.country_access',
					},
				},
				collection: 'country_data',
			},
			global: {
				directives: {
					tooltip: vi.fn(),
					'input-auto-width': vi.fn(),
				},
				stubs: {
					VIcon: true,
				},
			},
		});

		expect(wrapper.find('.list').exists()).toBe(false);
		expect(wrapper.emitted('update:field')).toBeUndefined();
		expect((wrapper.get('input').element as HTMLInputElement).value).toBe('$CURRENT_USER.country_access');

		await wrapper.get('input').setValue('$CURRENT_USER.country_access_codes');

		expect(wrapper.emitted('update:field')).toEqual([
			[
				{
					country: {
						_in: '$CURRENT_USER.country_access_codes',
					},
				},
			],
		]);
	});

	it('keeps wrapped dynamic-variable strings for _in filters', async () => {
		const wrapper = mount(InputGroup, {
			props: {
				field: {
					country: {
						_in: '{{$CURRENT_USER.country_access}}',
					},
				},
				collection: 'country_data',
			},
			global: {
				directives: {
					tooltip: vi.fn(),
					'input-auto-width': vi.fn(),
				},
				stubs: {
					VIcon: true,
				},
			},
		});

		expect(wrapper.find('.list').exists()).toBe(false);
		expect((wrapper.get('input').element as HTMLInputElement).value).toBe('$CURRENT_USER.country_access');

		await wrapper.get('input').setValue('$CURRENT_USER.country_access_codes');

		expect(wrapper.emitted('update:field')).toEqual([
			[
				{
					country: {
						_in: '{{$CURRENT_USER.country_access_codes}}',
					},
				},
			],
		]);
	});
});
