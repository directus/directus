import type { SettingsStorageAssetPreset } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ImagePresetPreviews from './image-preset-previews.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	plugins: [i18n],
	stubs: { VIcon: true },
};

function preset(overrides: Partial<SettingsStorageAssetPreset>): SettingsStorageAssetPreset {
	return {
		key: null,
		fit: 'cover',
		width: null,
		height: null,
		quality: null,
		withoutEnlargement: null,
		format: null,
		transforms: null,
		...overrides,
	};
}

const presets = [
	preset({ key: 'portrait', width: 600, height: 900 }),
	preset({ key: 'avatar', width: 400, height: 400 }),
	preset({ key: 'hero', width: 1600, height: 900 }),
	preset({ key: 'card', width: 800, height: 800 }),
	preset({ key: 'social', width: 1200, height: 675 }),
	preset({ key: 'contained', width: 400, height: 400, fit: 'contain' }),
	preset({ key: 'width-only', width: 400 }),
	preset({ key: 'same-ratio', width: 1500, height: 1000 }),
];

function mountPreviews(
	focalPoint: { x: number; y: number } | null = null,
	previewPresets: SettingsStorageAssetPreset[] = presets,
) {
	return mount(ImagePresetPreviews, {
		props: { src: '/assets/1', width: 3000, height: 2000, focalPoint, presets: previewPresets },
		global,
	});
}

describe('ImagePresetPreviews', () => {
	it('groups presets that crop the image by aspect ratio, widest first', () => {
		const wrapper = mountPreviews();

		expect(wrapper.findAll('.ratio').map((ratio) => ratio.text())).toEqual(['16:9', '1:1', '2:3']);

		expect(wrapper.findAll('.group').map((group) => group.attributes('aria-label'))).toEqual([
			'16:9, 2 Presets',
			'1:1, 2 Presets',
			'2:3, 1 Preset',
		]);
	});

	it('renders one thumbnail per group', () => {
		const wrapper = mountPreviews();

		expect(wrapper.findAll('.frame img')).toHaveLength(3);
	});

	it('shows the preset keys of each group on hover', () => {
		const wrapper = mountPreviews();

		expect(wrapper.find('.group').attributes('title')).toBe('hero, social');
	});

	it('groups by the dimensions capped by withoutEnlargement', () => {
		const wrapper = mountPreviews(null, [
			preset({ key: 'capped', width: 4000, height: 1000, withoutEnlargement: true }),
			preset({ key: 'wide', width: 3000, height: 1000 }),
		]);

		expect(wrapper.findAll('.ratio').map((ratio) => ratio.text())).toEqual(['3:1']);
	});

	it('shows an empty state when no presets crop the image', () => {
		const wrapper = mountPreviews(null, presets.slice(5));

		expect(wrapper.find('.groups').exists()).toBe(false);
		expect(wrapper.find('.empty').exists()).toBe(true);
	});

	it('replaces the previews with a notice while the image has unsaved edits', async () => {
		const wrapper = mountPreviews();

		await wrapper.setProps({ hasImageEdits: true });

		expect(wrapper.findComponent({ name: 'VNotice' }).exists()).toBe(true);
		expect(wrapper.find('.groups').exists()).toBe(false);
	});

	it('reframes the thumbnails when the focal point changes', async () => {
		const wrapper = mountPreviews({ x: 1500, y: 0 });
		const before = wrapper.find('.frame img').attributes('style');

		await wrapper.setProps({ focalPoint: { x: 1500, y: 2000 } });

		expect(wrapper.find('.frame img').attributes('style')).not.toEqual(before);
	});
});
