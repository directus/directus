import { mount } from '@vue/test-utils';
import { cloneDeep } from 'lodash-es';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, test } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import type { ToolbarButton, ToolbarContext } from './buttons';
import ToolbarButtonComponent from './toolbar-button.vue';
import { i18n } from '@/lang';

const tooltip = {
	mounted: (el: HTMLElement, { value }: { value: string }) => el.setAttribute('data-tooltip', value),
	updated: (el: HTMLElement, { value }: { value: string }) => el.setAttribute('data-tooltip', value),
};

function mountButton(button: ToolbarButton) {
	const router = createRouter({
		history: createMemoryHistory(),
		routes: [{ path: '/', component: { template: '<div />' } }],
	});

	return mount(ToolbarButtonComponent, {
		props: { button, editor: undefined, context: {} as ToolbarContext },
		global: { plugins: [createPinia(), i18n, router], directives: { tooltip } },
	});
}

const tooltipOf = (wrapper: ReturnType<typeof mountButton>) =>
	wrapper.find('[data-tooltip]').attributes('data-tooltip');

const enUS = cloneDeep(i18n.global.getLocaleMessage('en-US'));

afterEach(() => {
	i18n.global.locale.value = 'en-US';
	i18n.global.setLocaleMessage('en-US', cloneDeep(enUS));
	i18n.global.setLocaleMessage('de-DE', {});
});

describe('toolbar-button label', () => {
	test('translates the i18n key of a core button', () => {
		expect(tooltipOf(mountButton({ icon: 'format_align_left', label: 'wysiwyg_options.alignleft' }))).toBe(
			'Align Left',
		);
	});

	test('shows the plain label of a contributed button as is, even when it matches a core key', () => {
		expect(tooltipOf(mountButton({ icon: 'save', label: 'save', literalLabel: true }))).toBe('save');
	});

	test('resolves the $t: label of a contributed button against the custom translations', async () => {
		i18n.global.mergeLocaleMessage('en-US', { my_ext_callout: 'Callout' });
		i18n.global.mergeLocaleMessage('de-DE', { my_ext_callout: 'Hinweis' });

		const wrapper = mountButton({ icon: 'info', label: '$t:my_ext_callout', literalLabel: true });
		expect(tooltipOf(wrapper)).toBe('Callout');

		i18n.global.locale.value = 'de-DE';
		await wrapper.vm.$nextTick();
		expect(tooltipOf(wrapper)).toBe('Hinweis');
	});
});
