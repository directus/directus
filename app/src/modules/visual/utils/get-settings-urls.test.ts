import { describe, expect, it, vi } from 'vitest';
import { getSettingsUrls } from './get-settings-urls';
import { useSettingsStore } from '@/stores/settings';

vi.mock('@/stores/settings', () => ({
	useSettingsStore: vi.fn(),
}));

function mockSettings(urls: { url: string }[] | undefined, settingsNull = false) {
	vi.mocked(useSettingsStore).mockReturnValue({
		settings: settingsNull ? null : { visual_editor_urls: urls },
	} as any);
}

describe('getSettingsUrls', () => {
	it('resolves {{$version}} template', () => {
		mockSettings([{ url: 'https://example.com/?version={{$version}}' }]);
		expect(getSettingsUrls('draft')).toEqual(['https://example.com/?version=draft']);
	});

	it('resolves {{ $version }} template with spaces', () => {
		mockSettings([{ url: 'https://example.com/?v={{ $version }}' }]);
		expect(getSettingsUrls('draft')).toEqual(['https://example.com/?v=draft']);
	});

	it('passes through URLs without template', () => {
		mockSettings([{ url: 'https://example.com/path' }]);
		expect(getSettingsUrls('draft')).toEqual(['https://example.com/path']);
	});

	it('resolves template in path', () => {
		mockSettings([{ url: 'https://example.com/{{$version}}/preview' }]);
		expect(getSettingsUrls('draft')).toEqual(['https://example.com/draft/preview']);
	});

	it('resolves template in subdomain', () => {
		mockSettings([{ url: 'https://{{$version}}.example.com/preview' }]);
		expect(getSettingsUrls('draft')).toEqual(['https://draft.example.com/preview']);
	});

	it('defaults to main version when no arg provided', () => {
		mockSettings([{ url: 'https://example.com/?version={{$version}}' }]);
		expect(getSettingsUrls()).toEqual(['https://example.com/?version=main']);
	});

	it('filters out invalid URLs', () => {
		mockSettings([{ url: 'not-a-url' }, { url: 'https://example.com/?version={{$version}}' }]);
		expect(getSettingsUrls()).toEqual(['https://example.com/?version=main']);
	});

	it('returns empty array for empty settings', () => {
		mockSettings([]);
		expect(getSettingsUrls()).toEqual([]);
	});

	it('returns empty array for null settings', () => {
		mockSettings(undefined, true);
		expect(getSettingsUrls()).toEqual([]);
	});

	it('filters invalid URLs from mixed list', () => {
		mockSettings([{ url: 'https://a.com' }, { url: 'bad' }, { url: 'https://b.com' }]);
		expect(getSettingsUrls('main')).toEqual(['https://a.com', 'https://b.com']);
	});
});
