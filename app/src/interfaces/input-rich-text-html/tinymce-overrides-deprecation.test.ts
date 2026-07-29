import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import Interface from './input-rich-text-html.vue';

/**
 * `tinymceOverrides` is accepted but inert on the Tiptap editor: fields configured with it keep
 * loading, and a console deprecation warning points admins at the first-class replacements.
 */

async function mountWith(props: { value?: string | null; tinymceOverrides?: unknown } = {}) {
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	const wrapper = mount(Interface, {
		props: { value: null, ...props },
		global: {
			plugins: [createPinia(), i18n],
			stubs: { Toolbar: true, TableBubbleMenu: true, ImageDrawer: true, LinkDrawer: true },
		},
	});

	await flushPromises();
	return wrapper;
}

function deprecationWarnings(warn: ReturnType<typeof vi.spyOn>) {
	return warn.mock.calls.filter((call) => String(call[0]).includes('tinymceOverrides'));
}

describe('tinymceOverrides deprecation warning', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('warns when the field has a tinymceOverrides value', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await mountWith({ tinymceOverrides: { font_size_formats: '8pt 10pt' } });

		expect(deprecationWarnings(warn)).toHaveLength(1);
	});

	test('does not warn when tinymceOverrides is unset', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await mountWith({ value: '<p>hello</p>' });

		expect(deprecationWarnings(warn)).toHaveLength(0);
	});

	test('does not warn on an empty overrides object', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await mountWith({ tinymceOverrides: {} });

		expect(deprecationWarnings(warn)).toHaveLength(0);
	});
});
