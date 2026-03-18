import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VRemove from './v-remove.vue';
import type { GlobalMountOptions } from '@/__utils__/types.d.ts';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	stubs: {
		VIcon: { template: '<span :data-icon="name" />', props: ['name'] },
		VButton: { template: '<button><slot /></button>' },
		VDialog: true,
		VCard: true,
		VCardTitle: true,
		VCardActions: true,
	},
	plugins: [i18n],
	directives: {
		tooltip: () => {},
		'prevent-focusout': () => {},
	},
};

const m2mInfo = {
	type: 'm2m',
	relation: { field: 'related_id' },
	junction: { field: 'item_id' },
	junctionPrimaryKeyField: { field: 'id' },
	junctionField: { field: 'related_id' },
	relatedPrimaryKeyField: { field: 'id' },
	sortField: null,
};

// Edits that contain a field beyond the excluded keys — would trigger hasEdits if not guarded
const editsWithExtraField = { extra_field: 'value', $type: 'created' as const, $index: 0 };

describe('v-remove icon for relation items', () => {
	it('shows close icon for created item even when it has edits', () => {
		const wrapper = mount(VRemove, {
			props: {
				itemType: 'created',
				itemIsLocal: true,
				itemInfo: m2mInfo as any,
				itemEdits: editsWithExtraField,
			},
			global,
		});

		expect(wrapper.find('[data-icon="close"]').exists()).toBe(true);
		expect(wrapper.find('[data-icon="delete"]').exists()).toBe(false);
	});

	it('shows delete icon for updated item with edits (confirmation required)', () => {
		const wrapper = mount(VRemove, {
			props: {
				itemType: 'updated',
				itemIsLocal: true,
				itemInfo: m2mInfo as any,
				itemEdits: { ...editsWithExtraField, $type: 'updated' as const },
			},
			global,
		});

		expect(wrapper.find('[data-icon="delete"]').exists()).toBe(true);
		expect(wrapper.find('[data-icon="close"]').exists()).toBe(false);
	});

	it('shows delete icon for existing DB item (no local state)', () => {
		const wrapper = mount(VRemove, {
			props: {
				itemType: undefined,
				itemIsLocal: false,
				itemInfo: m2mInfo as any,
				itemEdits: {},
			},
			global,
		});

		expect(wrapper.find('[data-icon="delete"]').exists()).toBe(true);
	});
});
