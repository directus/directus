import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SaveOptions from './save-options.vue';
import { generateRouter } from '@/__utils__/router';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const OPTIONS = [
	{ key: 'save-and-quit', event: 'save-and-quit', label: 'Save and Quit' },
	{ key: 'save-and-stay', event: 'save-and-stay', label: 'Save and Stay' },
	{ key: 'save-and-add-new', event: 'save-and-add-new', label: 'Save and Create New' },
	{ key: 'save-as-copy', event: 'save-as-copy', label: 'Save as Copy' },
	{ key: 'discard-and-stay', event: 'discard-and-stay', label: 'Discard All Changes' },
] as const;

let global: GlobalMountOptions;

beforeEach(async () => {
	const router = generateRouter();
	router.push('/');
	await router.isReady();

	global = { plugins: [router, i18n, createTestingPinia({ createSpy: vi.fn })] };
});

function mountComponent(disabledOptions?: string[]) {
	return mount(SaveOptions, { props: { disabledOptions }, global });
}

function labels(wrapper: ReturnType<typeof mountComponent>) {
	return wrapper.findAll('.v-list-item .v-list-item-content').map((content) => content.text());
}

test('renders every option when none are disabled', () => {
	const wrapper = mountComponent();

	expect(labels(wrapper)).toEqual(OPTIONS.map(({ label }) => label));
});

describe.each(OPTIONS)('$key', ({ key, event, label }) => {
	test('is hidden when disabled', () => {
		const wrapper = mountComponent([key]);

		expect(labels(wrapper)).toEqual(OPTIONS.filter((option) => option.key !== key).map((option) => option.label));
	});

	test(`emits "${event}" when clicked`, async () => {
		const wrapper = mountComponent();

		const item = wrapper
			.findAll('.v-list-item')
			.find((candidate) => candidate.find('.v-list-item-content').text() === label);

		expect(item).toBeTruthy();

		await item!.trigger('click');

		expect(wrapper.emitted(event)).toHaveLength(1);
	});
});

test('hides multiple options at once', () => {
	const wrapper = mountComponent(['save-and-quit', 'save-as-copy']);

	expect(labels(wrapper)).toEqual(['Save and Stay', 'Save and Create New', 'Discard All Changes']);
});
