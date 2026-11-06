import type { FieldFilter } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import InputGroup from './input-group.vue';

// Raw-edited filters can hold values outside the declared FieldFilter type
// (e.g. a dynamic-variable string for _in) — that is exactly what this
// regression test mounts, so the cast is intentional.
function asFieldFilter(value: unknown): FieldFilter {
	return value as FieldFilter;
}

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

const mountOptions = {
	global: {
		directives: {
			tooltip: vi.fn(),
			'input-auto-width': vi.fn(),
		},
		stubs: {
			VIcon: true,
		},
	},
};

describe('InputGroup', () => {
	it('renders a dynamic-variable string for _in without crashing', async () => {
		const wrapper = mount(InputGroup, {
			props: {
				field: asFieldFilter({
					country: {
						_in: '$CURRENT_USER.country_access',
					},
				}),
				collection: 'country_data',
			},
			...mountOptions,
		});

		// No list of per-value inputs: the value is a single dynamic variable,
		// rendered like _eq does instead of being spread into list items
		expect(wrapper.findAll('.value').length).toBe(0);
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

	it('renders a wrapped dynamic-variable string for _in without crashing', async () => {
		const wrapper = mount(InputGroup, {
			props: {
				field: asFieldFilter({
					country: {
						_in: '{{$CURRENT_USER.country_access}}',
					},
				}),
				collection: 'country_data',
			},
			...mountOptions,
		});

		expect(wrapper.findAll('.value').length).toBe(0);
		expect((wrapper.get('input').element as HTMLInputElement).value).toBe('{{$CURRENT_USER.country_access}}');

		await wrapper.get('input').setValue('{{$CURRENT_USER.country_access_codes}}');

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

	it('renders a dynamic-variable string for _nin without crashing', async () => {
		const wrapper = mount(InputGroup, {
			props: {
				field: asFieldFilter({
					country: {
						_nin: '$CURRENT_USER.country_access',
					},
				}),
				collection: 'country_data',
			},
			...mountOptions,
		});

		expect(wrapper.findAll('.value').length).toBe(0);
		expect((wrapper.get('input').element as HTMLInputElement).value).toBe('$CURRENT_USER.country_access');
	});

	it('still renders array values for _in as a list', () => {
		const wrapper = mount(InputGroup, {
			props: {
				field: {
					country: {
						_in: ['en', 'de'],
					},
				},
				collection: 'country_data',
			},
			...mountOptions,
		});

		// Two values plus the trailing empty input
		expect(wrapper.findAll('.value').length).toBe(3);

		const inputs = wrapper.findAll('input');
		expect((inputs[0]!.element as HTMLInputElement).value).toBe('en');
		expect((inputs[1]!.element as HTMLInputElement).value).toBe('de');
	});
});
