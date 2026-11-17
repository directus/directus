import type { SettingsStorageAssetPreset } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Directive } from 'vue';
import ImagePresetPreviews from './image-preset-previews.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

// Keeps the tooltip text on the element so tests can read it
const tooltip: Directive<HTMLElement, string | null> = {
	mounted: (el, { value }) => (el.dataset.tooltip = value ?? ''),
	updated: (el, { value }) => (el.dataset.tooltip = value ?? ''),
};

const global: GlobalMountOptions = {
	plugins: [i18n],
	stubs: { VIcon: true },
	directives: { tooltip },
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
			'16:9, 2 Presets: hero, social',
			'1:1, 2 Presets: avatar, card',
			'2:3, 1 Preset: portrait',
		]);
	});

	it('names each group by its first preset and counts the others', () => {
		const wrapper = mountPreviews();

		expect(wrapper.findAll('.name').map((name) => name.text())).toEqual(['hero+1', 'avatar+1', 'portrait']);
	});

	it('renders one thumbnail per group', () => {
		const wrapper = mountPreviews();

		expect(wrapper.findAll('.frame img')).toHaveLength(3);
	});

	it('lists every preset of a shared group in a tooltip', () => {
		const wrapper = mountPreviews();

		expect(wrapper.findAll('.group').map((group) => group.attributes('data-tooltip'))).toEqual([
			'hero, social',
			'avatar, card',
			'',
		]);
	});

	it('groups by the dimensions capped by withoutEnlargement', () => {
		const wrapper = mountPreviews(null, [
			preset({ key: 'capped', width: 4000, height: 1000, withoutEnlargement: true }),
			preset({ key: 'wide', width: 3000, height: 1000 }),
		]);

		expect(wrapper.findAll('.ratio').map((ratio) => ratio.text())).toEqual(['3:1']);
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
