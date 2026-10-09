import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import SubmenuListItem from './submenu-list-item.vue';

// Render slots so we can assert on the activator row and the flyout content.
const global = {
	plugins: [createI18n({ legacy: false })],
	stubs: {
		VMenu: {
			template: `
				<div>
					<slot name="activator" :active="false" :toggle="() => {}" />
					<slot />
				</div>
			`,
		},
		VList: { template: '<div><slot /></div>' },
		VIcon: { props: ['name'], template: '<i class="v-icon" :data-name="name" />' },
		VListItem: { template: '<div class="v-list-item"><slot /></div>' },
		VListItemContent: { template: '<div class="content"><slot /></div>' },
		VListItemIcon: { template: '<div class="icon"><slot /></div>' },
	},
};

describe('submenu-list-item', () => {
	test('renders the label, leading icon and trailing chevron', () => {
		const wrapper = mount(SubmenuListItem, {
			props: { label: 'Table', icon: 'table' },
			global,
		});

		expect(wrapper.find('.content').text()).toBe('Table');

		const iconNames = wrapper.findAll('.v-icon').map((i) => i.attributes('data-name'));
		expect(iconNames).toContain('table');
		expect(iconNames).toContain('chevron_right');
	});

	test('omits the leading icon when none is provided', () => {
		const wrapper = mount(SubmenuListItem, { props: { label: 'Table' }, global });

		const iconNames = wrapper.findAll('.v-icon').map((i) => i.attributes('data-name'));
		expect(iconNames).toEqual(['chevron_right']);
	});

	test('renders slotted flyout content', () => {
		const wrapper = mount(SubmenuListItem, {
			props: { label: 'Table' },
			slots: { default: '<span class="flyout">grid</span>' },
			global,
		});

		expect(wrapper.find('.flyout').exists()).toBe(true);
	});
});
