import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useVisualEditing } from '@/composables/use-visual-editing';

const mockModuleBar = vi.hoisted(() => ({
	value: [] as Array<{ type: string; id: string; enabled: boolean }>,
}));

const mockVisualEditorUrls = vi.hoisted(() => ({
	value: [] as Array<{ url: string }>,
}));

vi.mock('@/utils/normalize-url', () => ({
	normalizeUrl: (url: string | null) => url,
}));

vi.mock('@/stores/settings', () => ({
	useSettingsStore: () => ({
		settings: {
			get module_bar() {
				return mockModuleBar.value;
			},
			get visual_editor_urls() {
				return mockVisualEditorUrls.value;
			},
		},
	}),
}));

beforeEach(() => {
	mockModuleBar.value = [
		{ type: 'module', id: 'content', enabled: true },
		{ type: 'module', id: 'visual', enabled: true },
	];

	mockVisualEditorUrls.value = [{ url: 'https://example.com' }];
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('useVisualEditing', () => {
	test('visualEditingEnabled is false when isNew is true', () => {
		const { visualEditingEnabled } = useVisualEditing({
			previewUrl: 'https://example.com/preview',
			isNew: true,
		});

		expect(visualEditingEnabled.value).toBe(false);
	});

	test('visualEditingEnabled is false when previewUrl is null', () => {
		const { visualEditingEnabled } = useVisualEditing({
			previewUrl: null,
			isNew: false,
		});

		expect(visualEditingEnabled.value).toBe(false);
	});

	test('visualEditingEnabled is true when visual module not in module_bar (only checks URLs)', () => {
		mockModuleBar.value = [{ type: 'module', id: 'content', enabled: true }];

		const { visualEditingEnabled } = useVisualEditing({
			previewUrl: 'https://example.com/preview',
			isNew: false,
		});

		expect(visualEditingEnabled.value).toBe(true);
	});

	test('visualEditingEnabled is true when visual module is disabled (only checks URLs)', () => {
		mockModuleBar.value = [
			{ type: 'module', id: 'content', enabled: true },
			{ type: 'module', id: 'visual', enabled: false },
		];

		const { visualEditingEnabled } = useVisualEditing({
			previewUrl: 'https://example.com/preview',
			isNew: false,
		});

		expect(visualEditingEnabled.value).toBe(true);
	});

	test('visualModuleEnabled is false when visual module not in module_bar', () => {
		mockModuleBar.value = [{ type: 'module', id: 'content', enabled: true }];

		const { visualModuleEnabled } = useVisualEditing({
			previewUrl: 'https://example.com/preview',
			isNew: false,
		});

		expect(visualModuleEnabled.value).toBe(false);
	});

	test('visualModuleEnabled is false when visual module is disabled', () => {
		mockModuleBar.value = [
			{ type: 'module', id: 'content', enabled: true },
			{ type: 'module', id: 'visual', enabled: false },
		];

		const { visualModuleEnabled } = useVisualEditing({
			previewUrl: 'https://example.com/preview',
			isNew: false,
		});

		expect(visualModuleEnabled.value).toBe(false);
	});

	test('visualModuleEnabled is true when visual module is enabled', () => {
		const { visualModuleEnabled } = useVisualEditing({
			previewUrl: 'https://example.com/preview',
			isNew: false,
		});

		expect(visualModuleEnabled.value).toBe(true);
	});

	test('visualEditingEnabled is false when visual_editor_urls is empty', () => {
		mockVisualEditorUrls.value = [];

		const { visualEditingEnabled } = useVisualEditing({
			previewUrl: 'https://example.com/preview',
			isNew: false,
		});

		expect(visualEditingEnabled.value).toBe(false);
	});

	test('visualEditingEnabled is true when all prerequisites are met', () => {
		const { visualEditingEnabled } = useVisualEditing({
			previewUrl: 'https://example.com/preview',
			isNew: false,
		});

		expect(visualEditingEnabled.value).toBe(true);
	});

	test('visualEditorUrls extracts URLs correctly from settings', () => {
		mockVisualEditorUrls.value = [{ url: 'https://example.com' }, { url: 'https://another.com' }, { url: '' }];

		const { visualEditorUrls } = useVisualEditing({
			previewUrl: 'https://example.com/preview',
		});

		expect(visualEditorUrls.value).toEqual(['https://example.com', 'https://another.com']);
	});

	test('visualEditingEnabled reacts to isNew ref changes', () => {
		const isNew = ref(true);

		const { visualEditingEnabled } = useVisualEditing({
			previewUrl: 'https://example.com/preview',
			isNew,
		});

		expect(visualEditingEnabled.value).toBe(false);

		isNew.value = false;
		expect(visualEditingEnabled.value).toBe(true);
	});

	test('visualEditingEnabled reacts to previewUrl ref changes', () => {
		const previewUrl = ref<string | null>(null);

		const { visualEditingEnabled } = useVisualEditing({
			previewUrl,
			isNew: false,
		});

		expect(visualEditingEnabled.value).toBe(false);

		previewUrl.value = 'https://example.com/preview';
		expect(visualEditingEnabled.value).toBe(true);
	});
});
