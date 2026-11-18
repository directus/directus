import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import SystemLinkProtocols from './system-link-protocols.vue';
import InterfaceTags from '@/interfaces/tags/tags.vue';

const i18n = createI18n({ legacy: false, locale: 'en-US', missingWarn: false, fallbackWarn: false });

function mountProtocols(value: string[] | null = null) {
	return mount(SystemLinkProtocols, {
		props: { value },
		global: { plugins: [i18n], stubs: { InterfaceTags: true, VNotice: { template: '<div><slot /></div>' } } },
	});
}

async function add(wrapper: ReturnType<typeof mountProtocols>, entries: string[]) {
	await wrapper.findComponent(InterfaceTags).vm.$emit('input', entries);
}

describe('system-link-protocols', () => {
	test('stores schemes normalised and de-duplicated', async () => {
		const wrapper = mountProtocols();

		await add(wrapper, [' MyApp:// ', 'myapp', 'web+app:']);

		expect(wrapper.emitted('input')).toEqual([[['myapp', 'web+app']]]);
		expect(wrapper.find('.rejected').exists()).toBe(false);
	});

	test.each(['javascript', 'JavaScript://', 'vbscript:', 'data'])('rejects the script scheme %s', async (entry) => {
		const wrapper = mountProtocols(['myapp']);

		await add(wrapper, ['myapp', entry]);

		expect(wrapper.emitted('input')).toEqual([[['myapp']]]);
		expect(wrapper.find('.rejected').text()).toBe('interfaces.input-rich-text-html.link_protocols_blocked');
	});

	test.each(['1bad', 'no spaces', 'my_app'])('rejects the invalid scheme %s', async (entry) => {
		const wrapper = mountProtocols();

		await add(wrapper, [entry]);

		expect(wrapper.emitted('input')).toEqual([[[]]]);
		expect(wrapper.find('.rejected').text()).toBe('interfaces.input-rich-text-html.link_protocols_invalid');
	});

	test('passes tags a new array after a rejection, so it drops the rejected chip', async () => {
		const wrapper = mountProtocols(['myapp']);
		const before = wrapper.findComponent(InterfaceTags).props('value');

		await add(wrapper, ['myapp', 'javascript']);

		const after = wrapper.findComponent(InterfaceTags).props('value');
		expect(after).toEqual(['myapp']);
		expect(after).not.toBe(before);
	});

	test('clears the warning after a valid entry', async () => {
		const wrapper = mountProtocols();

		await add(wrapper, ['javascript']);
		await add(wrapper, ['myapp']);

		expect(wrapper.find('.rejected').exists()).toBe(false);
	});
});
