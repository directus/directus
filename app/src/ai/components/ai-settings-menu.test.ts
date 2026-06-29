import { shallowMount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import AiSettingsMenu from './ai-settings-menu.vue';

const toolsStore = vi.hoisted(() => ({
	systemTools: ['items'],
	getToolApprovalMode: vi.fn(() => 'ask'),
	setToolApprovalMode: vi.fn(),
}));

vi.mock('../stores/use-ai-tools', () => ({
	useAiToolsStore: () => toolsStore,
}));

vi.mock('vue-i18n', async (importOriginal) => {
	const actual = await importOriginal<typeof import('vue-i18n')>();

	return {
		...actual,
		useI18n: () => ({ t: (key: string) => key }),
	};
});

vi.mock('@directus/format-title', () => ({ default: (value: string) => value }));

const SlotStub = defineComponent({
	template: '<div><slot /></div>',
});

const VSelectStub = defineComponent({
	name: 'VSelect',
	props: {
		disabled: Boolean,
		modelValue: {
			type: String,
			default: null,
		},
	},
	template: '<div class="v-select-stub"><slot name="preview" /></div>',
});

function mountMenu() {
	return shallowMount(AiSettingsMenu, {
		global: {
			directives: {
				tooltip: {
					beforeMount(el, binding) {
						if (binding.value) el.setAttribute('data-tooltip', binding.value);
					},
				},
			},
			mocks: {
				$t: (key: string) => key,
			},
			stubs: {
				VButton: SlotStub,
				VDivider: SlotStub,
				VIcon: SlotStub,
				VInput: SlotStub,
				VList: SlotStub,
				VListItem: SlotStub,
				VListItemContent: SlotStub,
				VListItemIcon: SlotStub,
				VMenu: defineComponent({
					template: '<div><slot name="activator" :toggle="() => {}" /><slot /></div>',
				}),
				VSelect: VSelectStub,
			},
		},
	});
}

describe('AiSettingsMenu', () => {
	test('shows configurable system tools without schema', () => {
		const wrapper = mountMenu();
		const selects = wrapper.findAllComponents(VSelectStub);

		expect(selects).toHaveLength(1);
		expect(selects[0]?.props('disabled')).toBe(false);
		expect(wrapper.text()).toContain('ai_tools.items');
		expect(wrapper.text()).not.toContain('ai_tools.schema');
	});
});
