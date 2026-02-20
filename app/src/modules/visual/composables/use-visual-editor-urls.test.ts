import { describe, expect, it, vi } from 'vitest';
import { useVisualEditorUrls } from './use-visual-editor-urls';
import { useSettingsStore } from '@/stores/settings';

vi.mock('@/stores/settings', () => ({
	useSettingsStore: vi.fn(),
}));

function mockSettings(urls: { url: string }[] | undefined, settingsNull = false) {
	vi.mocked(useSettingsStore).mockReturnValue({
		settings: settingsNull ? null : { visual_editor_urls: urls },
	} as unknown as ReturnType<typeof useSettingsStore>);
}

describe('useVisualEditorUrls', () => {
	describe('urlTemplates', () => {
		it('returns raw template strings', () => {
			mockSettings([{ url: 'https://example.com/?version={{$version}}' }]);
			const { urlTemplates } = useVisualEditorUrls();
			expect(urlTemplates.value).toEqual(['https://example.com/?version={{$version}}']);
		});

		it('returns empty array for null settings', () => {
			mockSettings(undefined, true);
			const { urlTemplates } = useVisualEditorUrls();
			expect(urlTemplates.value).toEqual([]);
		});

		it('returns empty array for empty list', () => {
			mockSettings([]);
			const { urlTemplates } = useVisualEditorUrls();
			expect(urlTemplates.value).toEqual([]);
		});

		it('returns an empty array for empty URL', () => {
			mockSettings([{ url: '' }]);
			const { urlTemplates } = useVisualEditorUrls();
			expect(urlTemplates.value).toEqual([]);
		});
	});

	describe('resolveUrls', () => {
		it('resolves {{$version}} template', () => {
			mockSettings([{ url: 'https://example.com/?version={{$version}}' }]);
			const { resolveUrls } = useVisualEditorUrls();
			expect(resolveUrls('draft')).toEqual(['https://example.com/?version=draft']);
		});

		it('resolves {{ $version }} template with spaces', () => {
			mockSettings([{ url: 'https://example.com/?v={{ $version }}' }]);
			const { resolveUrls } = useVisualEditorUrls();
			expect(resolveUrls('draft')).toEqual(['https://example.com/?v=draft']);
		});

		it('passes through URLs without template', () => {
			mockSettings([{ url: 'https://example.com/path' }]);
			const { resolveUrls } = useVisualEditorUrls();
			expect(resolveUrls('draft')).toEqual(['https://example.com/path']);
		});

		it('resolves template in path', () => {
			mockSettings([{ url: 'https://example.com/{{$version}}/preview' }]);
			const { resolveUrls } = useVisualEditorUrls();
			expect(resolveUrls('draft')).toEqual(['https://example.com/draft/preview']);
		});

		it('resolves template in subdomain', () => {
			mockSettings([{ url: 'https://{{$version}}.example.com/preview' }]);
			const { resolveUrls } = useVisualEditorUrls();
			expect(resolveUrls('draft')).toEqual(['https://draft.example.com/preview']);
		});

		it('defaults to main version when no arg provided', () => {
			mockSettings([{ url: 'https://example.com/?version={{$version}}' }]);
			const { resolveUrls } = useVisualEditorUrls();
			expect(resolveUrls()).toEqual(['https://example.com/?version=main']);
		});

		it('filters out invalid URLs', () => {
			mockSettings([{ url: 'not-a-url' }, { url: 'https://example.com/?version={{$version}}' }]);
			const { resolveUrls } = useVisualEditorUrls();
			expect(resolveUrls()).toEqual(['https://example.com/?version=main']);
		});

		it('returns empty array for empty settings', () => {
			mockSettings([]);
			const { resolveUrls } = useVisualEditorUrls();
			expect(resolveUrls()).toEqual([]);
		});

		it('returns empty array for null settings', () => {
			mockSettings(undefined, true);
			const { resolveUrls } = useVisualEditorUrls();
			expect(resolveUrls()).toEqual([]);
		});

		it('filters invalid URLs from mixed list', () => {
			mockSettings([{ url: 'https://a.com' }, { url: 'bad' }, { url: 'https://b.com' }]);
			const { resolveUrls } = useVisualEditorUrls();
			expect(resolveUrls()).toEqual(['https://a.com', 'https://b.com']);
		});
	});

	describe('firstResolvedUrl', () => {
		it('returns first valid URL', () => {
			mockSettings([{ url: 'https://example.com/?version={{$version}}' }]);
			const { firstResolvedUrl } = useVisualEditorUrls();
			expect(firstResolvedUrl.value).not.toBeNull();
		});

		it('returns null when no URLs', () => {
			mockSettings([]);
			const { firstResolvedUrl } = useVisualEditorUrls();
			expect(firstResolvedUrl.value).toBeNull();
		});

		it('returns null for null settings', () => {
			mockSettings(undefined, true);
			const { firstResolvedUrl } = useVisualEditorUrls();
			expect(firstResolvedUrl.value).toBeNull();
		});

		it('skips invalid URLs and returns first valid one', () => {
			mockSettings([{ url: 'invalid-url' }, { url: 'https://example.com' }]);
			const { firstResolvedUrl } = useVisualEditorUrls();
			expect(firstResolvedUrl.value).toBe('https://example.com');
		});
	});
});
