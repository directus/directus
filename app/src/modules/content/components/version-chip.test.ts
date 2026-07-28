import { VERSION_KEY_DRAFT } from '@directus/constants';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VersionChip from './version-chip.vue';

const mountOptions = {
	global: {
		stubs: {
			VChip: {
				props: ['kind', 'clickable'],
				template: '<button class="v-chip" :class="[kind, { clickable }]"><slot /></button>',
			},
			VIcon: { props: ['name'], template: '<span class="v-icon" :data-name="name" />' },
			VTextOverflow: { template: '<span class="v-text-overflow" />' },
		},
	},
};

describe('VersionChip', () => {
	describe('kind variant', () => {
		it('uses primary when version is null', () => {
			const wrapper = mount(VersionChip, { ...mountOptions, props: { version: null } });
			expect(wrapper.classes()).toContain('primary');
		});

		it('uses secondary when version key is the draft key', () => {
			const wrapper = mount(VersionChip, {
				...mountOptions,
				props: { version: { key: VERSION_KEY_DRAFT, name: null } },
			});

			expect(wrapper.classes()).toContain('secondary');
		});

		it('uses neutral for any other version key', () => {
			const wrapper = mount(VersionChip, {
				...mountOptions,
				props: { version: { key: 'my-version', name: 'My Version' } },
			});

			expect(wrapper.classes()).toContain('neutral');
		});
	});

	it('reacts to version prop changes', async () => {
		const wrapper = mount(VersionChip, { ...mountOptions, props: { version: null } });
		expect(wrapper.classes()).toContain('primary');

		await wrapper.setProps({ version: { key: 'my-version', name: 'My Version' } });
		expect(wrapper.classes()).toContain('neutral');
		expect(wrapper.classes()).not.toContain('primary');
	});

	describe('clickable prop', () => {
		it('is clickable and shows the dropdown arrow by default', () => {
			const wrapper = mount(VersionChip, { ...mountOptions, props: { version: null } });
			expect(wrapper.classes()).toContain('clickable');
			expect(wrapper.classes()).not.toContain('not-clickable');
			expect(wrapper.find('[data-name="arrow_drop_down"]').exists()).toBe(true);
		});

		it('hides the dropdown arrow and applies non-clickable styling when clickable is false', () => {
			const wrapper = mount(VersionChip, {
				...mountOptions,
				props: { version: null, clickable: false },
			});

			expect(wrapper.classes()).not.toContain('clickable');
			expect(wrapper.classes()).toContain('not-clickable');
			expect(wrapper.find('[data-name="arrow_drop_down"]').exists()).toBe(false);
		});
	});
});
