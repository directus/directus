import { expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useFakePreviewBaseUrlField } from '@/composables/use-fake-preview-base-url-field';

vi.mock('vue-i18n', () => ({
	useI18n: () => ({ t: vi.fn((key: string) => key) }),
}));

test('Offers the variable for the given collection', () => {
	const { fakePreviewBaseUrlField } = useFakePreviewBaseUrlField(ref('articles'), ref(true));

	const field = fakePreviewBaseUrlField.value;

	expect(field?.field).toBe('$preview_base_url');
	// Must match the collection, or use-field-tree filters it out of the dropdown
	expect(field?.collection).toBe('articles');
	// An alias/no-data special would also drop it from the dropdown
	expect(field?.meta?.special).toBeNull();
});

test('Offers nothing when disabled or without a collection', () => {
	expect(useFakePreviewBaseUrlField(ref('articles'), ref(false)).fakePreviewBaseUrlField.value).toBeNull();
	expect(useFakePreviewBaseUrlField(ref(null), ref(true)).fakePreviewBaseUrlField.value).toBeNull();
});
