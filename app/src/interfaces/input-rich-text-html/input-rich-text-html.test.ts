import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';
import InputRichTextHtml from './input-rich-text-html.vue';

const tinymceRemove = vi.fn();

vi.mock('tinymce/tinymce', () => ({
	default: {
		remove: (...args: any[]) => tinymceRemove(...args),
		addI18n: vi.fn(),
	},
}));

vi.mock('tinymce/skins/ui/oxide/skin.css', () => ({}));
vi.mock('tinymce/icons/default', () => ({}));
vi.mock('tinymce/models/dom', () => ({}));
vi.mock('tinymce/plugins/autoresize/plugin', () => ({}));
vi.mock('tinymce/plugins/code/plugin', () => ({}));
vi.mock('tinymce/plugins/directionality/plugin', () => ({}));
vi.mock('tinymce/plugins/fullscreen/plugin', () => ({}));
vi.mock('tinymce/plugins/image/plugin', () => ({}));
vi.mock('tinymce/plugins/insertdatetime/plugin', () => ({}));
vi.mock('tinymce/plugins/link/plugin', () => ({}));
vi.mock('tinymce/plugins/lists/plugin', () => ({}));
vi.mock('tinymce/plugins/media/plugin', () => ({}));
vi.mock('tinymce/plugins/pagebreak/plugin', () => ({}));
vi.mock('tinymce/plugins/preview/plugin', () => ({}));
vi.mock('tinymce/plugins/table/plugin', () => ({}));
vi.mock('tinymce/themes/silver', () => ({}));
vi.mock('./tinymce-overrides.css', () => ({}));

vi.mock('@tinymce/tinymce-vue', () => ({
	default: { template: '<div class="tinymce-stub" />' },
}));

vi.mock('@/stores/settings', () => ({
	useSettingsStore: () => ({ settings: { storage_asset_transform: 'all', storage_asset_presets: [] } }),
}));

vi.mock('@/stores/server', () => ({
	useServerStore: () => ({ info: { files: { mimeTypeAllowList: null } } }),
}));

vi.mock('@/composables/use-focus-trap-manager', () => ({
	useInjectFocusTrapManager: () => ({ pauseFocusTrap: vi.fn(), unpauseFocusTrap: vi.fn() }),
}));

vi.mock('@/composables/use-focusin', () => ({
	useFocusin: () => ({ focus: vi.fn(), blur: vi.fn() }),
}));

vi.mock('@/composables/use-mime-type-filter', () => ({
	parseGlobalMimeTypeAllowList: () => null,
}));

vi.mock('./useImage', () => ({
	default: () => ({
		imageDrawerOpen: ref(false),
		imageSelection: ref(null),
		closeImageDrawer: vi.fn(),
		onImageSelect: vi.fn(),
		saveImage: vi.fn(),
		imageButton: {},
	}),
}));

vi.mock('./useMedia', () => ({
	default: () => ({
		mediaDrawerOpen: ref(false),
		mediaSelection: ref(null),
		closeMediaDrawer: vi.fn(),
		openMediaTab: ref('video'),
		onMediaSelect: vi.fn(),
		embed: ref(''),
		saveMedia: vi.fn(),
		mediaHeight: ref(''),
		mediaWidth: ref(''),
		mediaSource: ref(''),
		mediaButton: {},
	}),
}));

vi.mock('./useLink', () => ({
	default: () => ({
		linkButton: {},
		linkDrawerOpen: ref(false),
		closeLinkDrawer: vi.fn(),
		saveLink: vi.fn(),
		linkSelection: ref({ url: '', displayText: '', title: '', newTab: false }),
		isLinkSaveable: ref(false),
	}),
}));

vi.mock('./useSourceCode', () => ({
	default: () => ({
		codeDrawerOpen: ref(false),
		code: ref(''),
		closeCodeDrawer: vi.fn(),
		saveCode: vi.fn(),
		sourceCodeButton: {},
	}),
}));

vi.mock('./usePre', () => ({
	default: () => ({ preButton: {} }),
}));

vi.mock('./useInlineCode', () => ({
	default: () => ({ inlineCodeButton: {} }),
}));

vi.mock('./get-editor-styles', () => ({
	default: () => '',
}));

vi.mock('./toolbar-default', () => ({
	default: ['bold', 'italic'],
}));

vi.mock('@/lang', () => ({
	i18n: createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } }),
}));

vi.mock('@/utils/percentage', () => ({
	percentage: () => 100,
}));

vi.mock('@/views/private', () => ({
	PrivateViewHeaderBarActionButton: { template: '<button />' },
}));

vi.mock('@/interfaces/input-code/input-code.vue', () => ({
	default: { template: '<div />' },
}));

vi.mock('@/components/v-button.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-card-actions.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-card-text.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-card-title.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-card.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-checkbox.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-dialog.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-drawer.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-input.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-select/v-select.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-tab-item.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-tab.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-tabs-items.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-tabs.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-textarea.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/v-upload.vue', () => ({ default: { template: '<div><slot /></div>' } }));

const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

describe('input-rich-text-html onUnmounted cleanup', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		tinymceRemove.mockClear();
	});

	it('calls tinymce.remove() for editorRef on unmount', () => {
		const wrapper = mount(InputRichTextHtml, {
			props: { value: '<p>Hello</p>' },
			global: {
				plugins: [i18n],
				directives: {
					'prevent-focusout': {},
				},
			},
		});

		const vm = wrapper.vm as any;

		const fakeEditor = {
			id: 'main-editor',
			remove: vi.fn(),
			ui: {
				registry: {
					addToggleButton: vi.fn(),
					addButton: vi.fn(),
					getAll: vi.fn(() => ({ buttons: {} })),
				},
			},
			on: vi.fn(),
			addShortcut: vi.fn(),
			shortcuts: { remove: vi.fn() },
		};

		if (vm.editorOptions?.setup) {
			vm.editorOptions.setup(fakeEditor);
		}

		wrapper.unmount();

		expect(tinymceRemove).toHaveBeenCalledWith(fakeEditor);
	});

	it('calls tinymce.remove() for comparisonEditorRef on unmount', () => {
		const wrapper = mount(InputRichTextHtml, {
			props: { value: '<p>Hello</p>', nonEditable: true },
			global: {
				plugins: [i18n],
				directives: {
					'prevent-focusout': {},
				},
			},
		});

		const vm = wrapper.vm as any;

		const fakeComparisonEditor = {
			id: 'comparison-editor',
			on: vi.fn(),
			setContent: vi.fn(),
		};

		if (vm.comparisonEditorOptions?.setup) {
			vm.comparisonEditorOptions.setup(fakeComparisonEditor);
		}

		wrapper.unmount();

		expect(tinymceRemove).toHaveBeenCalledWith(fakeComparisonEditor);
	});

	it('does not call tinymce.remove() when no editor was initialized', () => {
		const wrapper = mount(InputRichTextHtml, {
			props: { value: null },
			global: {
				plugins: [i18n],
				directives: {
					'prevent-focusout': {},
				},
			},
		});

		wrapper.unmount();

		expect(tinymceRemove).not.toHaveBeenCalled();
	});
});
