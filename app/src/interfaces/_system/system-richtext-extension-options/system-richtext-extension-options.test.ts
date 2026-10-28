import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import SystemRichtextExtensionOptions from './system-richtext-extension-options.vue';
import VForm from '@/components/v-form/v-form.vue';
import { registerRichTexts } from '@/rich-text/register';

const i18n = createI18n({
	legacy: false,
	locale: 'en-US',
	messages: { 'en-US': { interfaces: { 'input-rich-text-html': { extension_options_for: '{extension} Options' } } } },
});

const tones = { field: 'tones', type: 'json', schema: { default_value: ['info'] } };

afterEach(() => registerRichTexts([]));

function mountOptions(props: { value: Record<string, Record<string, unknown>> | null; extensions: string[] }) {
	registerRichTexts([
		{ id: 'callout', name: 'Callout', options: [tones] },
		{ id: 'badge', name: 'Badge', options: [{ field: 'variant', type: 'string' }] },
		{ id: 'kbd', name: 'Keyboard Key' },
	]);

	return mount(SystemRichtextExtensionOptions, { props, global: { plugins: [i18n], stubs: { VForm: true } } });
}

describe('system-richtext-extension-options', () => {
	test('renders a form for each enabled extension that declares options', () => {
		const wrapper = mountOptions({ value: null, extensions: ['kbd', 'callout'] });

		expect(wrapper.findAll('.label').map((label) => label.text())).toEqual(['Callout Options']);
		expect(wrapper.findComponent(VForm).props('fields')).toEqual([tones]);
	});

	test("edits one extension's values and keeps the others", async () => {
		const wrapper = mountOptions({
			value: { badge: { variant: 'pill' }, removed: { kept: true } },
			extensions: ['callout', 'badge'],
		});

		await wrapper.findAllComponents(VForm)[0]!.vm.$emit('update:modelValue', { tones: ['danger'] });

		expect(wrapper.emitted('input')![0]).toEqual([
			{ badge: { variant: 'pill' }, removed: { kept: true }, callout: { tones: ['danger'] } },
		]);
	});

	test("passes each form only its extension's stored values", () => {
		const wrapper = mountOptions({ value: { badge: { variant: 'pill' } }, extensions: ['callout', 'badge'] });
		const [calloutForm, badgeForm] = wrapper.findAllComponents(VForm);

		expect(calloutForm!.props('modelValue')).toEqual({});
		expect(badgeForm!.props('modelValue')).toEqual({ variant: 'pill' });
	});
});
