import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VersionChip from './version-chip.vue';
import { DRAFT_VERSION_KEY } from '@/constants';

const mountOptions = {
	global: {
		stubs: {
			VChip: { template: '<button class="v-chip"><slot /></button>' },
			VIcon: { template: '<span class="v-icon" />' },
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
				props: { version: { key: DRAFT_VERSION_KEY, name: null } },
			});

			expect(wrapper.classes()).toContain('secondary');
		});

		it('uses normal for any other version key', () => {
			const wrapper = mount(VersionChip, {
				...mountOptions,
				props: { version: { key: 'my-version', name: 'My Version' } },
			});

			expect(wrapper.classes()).toContain('normal');
		});
	});

	it('reacts to version prop changes', async () => {
		const wrapper = mount(VersionChip, { ...mountOptions, props: { version: null } });
		expect(wrapper.classes()).toContain('primary');

		await wrapper.setProps({ version: { key: 'my-version', name: 'My Version' } });
		expect(wrapper.classes()).toContain('normal');
		expect(wrapper.classes()).not.toContain('primary');
	});
});
