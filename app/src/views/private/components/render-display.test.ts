import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import RenderDisplay from './render-display.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import datetimeDisplay from '@/displays/datetime';
import { i18n } from '@/lang';

vi.mock('@/composables/use-extension', () => ({
	useExtension: () => ({ value: {} }),
}));

const StubDisplay = defineComponent({
	props: { value: { type: [String, Number, Boolean, Object, Array], default: undefined } },
	setup(props) {
		return () => h('span', { class: 'stub' }, JSON.stringify(props.value));
	},
});

const global: GlobalMountOptions = {
	components: {
		'display-stub': StubDisplay,
		'display-datetime': datetimeDisplay.component,
	},
	plugins: [i18n],
};

describe('RenderDisplay', () => {
	test('renders a scalar value through the display as-is', () => {
		const wrapper = mount(RenderDisplay, {
			props: {
				value: '2026-07-29T12:00:00',
				display: 'stub',
				type: 'dateTime',
				collection: 'authors',
				field: 'joined_at',
			},
			global,
		});

		const stubs = wrapper.findAll('.stub');

		expect(stubs).toHaveLength(1);
		expect(stubs[0]!.text()).toBe('"2026-07-29T12:00:00"');
	});

	test('renders each entry of an array value through the display individually', () => {
		const wrapper = mount(RenderDisplay, {
			props: {
				value: ['2026-07-29T12:00:00', '2026-08-04T09:30:00'],
				display: 'stub',
				type: 'dateTime',
				collection: 'authors',
				field: 'joined_at',
			},
			global,
		});

		const stubs = wrapper.findAll('.stub');

		expect(stubs).toHaveLength(2);
		expect(stubs[0]!.text()).toBe('"2026-07-29T12:00:00"');
		expect(stubs[1]!.text()).toBe('"2026-08-04T09:30:00"');
		expect(wrapper.html()).toContain(',');
	});

	test('passes the array through as a single value for types whose displays expect arrays', () => {
		const wrapper = mount(RenderDisplay, {
			props: {
				value: [{ id: 1 }, { id: 2 }],
				display: 'stub',
				type: 'alias',
				collection: 'authors',
				field: 'articles',
			},
			global,
		});

		const stubs = wrapper.findAll('.stub');

		expect(stubs).toHaveLength(1);
		expect(stubs[0]!.text()).toBe('[{"id":1},{"id":2}]');
	});

	test('renders an empty array as null', () => {
		const wrapper = mount(RenderDisplay, {
			props: {
				value: [],
				display: 'stub',
				type: 'dateTime',
				collection: 'authors',
				field: 'joined_at',
			},
			global,
		});

		expect(wrapper.findAll('.stub')).toHaveLength(0);
		expect(wrapper.find('.null').exists()).toBe(true);
	});

	test('formats datetime values reached through a to-many relation instead of rendering them raw', () => {
		const wrapper = mount(RenderDisplay, {
			props: {
				value: ['2026-07-29T12:00:00'],
				display: 'datetime',
				type: 'dateTime',
				collection: 'authors',
				field: 'joined_at',
			},
			global,
		});

		expect(wrapper.html()).not.toContain('2026-07-29T12:00:00');
		expect(wrapper.html()).toContain('2026');
	});
});
