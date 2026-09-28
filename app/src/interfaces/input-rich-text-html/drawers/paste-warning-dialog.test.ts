import { mount } from '@vue/test-utils';
import type { Change } from 'diff';
import { describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import PasteWarningDialog from './paste-warning-dialog.vue';
import VDialog from '@/components/v-dialog.vue';

const DIFF: Change[] = [
	{ value: '<p>\n', count: 1, added: false, removed: false },
	{ value: '  <span style="white-space: pre-wrap;">Grass</span>\n', count: 1, added: false, removed: true },
	{ value: '  Grass\n', count: 1, added: true, removed: false },
	{ value: '</p>\n', count: 1, added: false, removed: false },
];

function mountDialog(undoable: boolean) {
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	return mount(PasteWarningDialog, {
		props: { modelValue: true, diff: DIFF, undoable },
		global: {
			plugins: [i18n],
			stubs: {
				VDialog: { template: '<div><slot /></div>' },
				VCard: { template: '<div><slot /></div>' },
				VCardTitle: { template: '<div><slot /></div>' },
				VCardActions: { template: '<div><slot /></div>' },
				VNotice: { template: '<div class="notice"><slot /></div>' },
				// without `emits` the parent's click listener also falls through to the native button and fires twice
				VButton: { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
			},
		},
	});
}

function buttons(wrapper: ReturnType<typeof mountDialog>) {
	return wrapper.findAll('button');
}

describe('paste warning dialog', () => {
	test('offers undo and raw paste while the paste is still undoable', async () => {
		const wrapper = mountDialog(true);

		expect(wrapper.find('.notice').text()).toBe('wysiwyg_options.paste_warning_body');

		const [undo, raw, keep] = buttons(wrapper);

		expect(buttons(wrapper).map((button) => button.text())).toEqual([
			'wysiwyg_options.paste_warning_undo',
			'wysiwyg_options.paste_warning_paste_raw',
			'wysiwyg_options.paste_warning_keep',
		]);

		await undo!.trigger('click');
		await raw!.trigger('click');
		await keep!.trigger('click');

		expect(wrapper.emitted()).toMatchObject({ undo: [[]], raw: [[]], keep: [[]] });
	});

	test('only offers to keep once the paste is no longer the newest history event', async () => {
		const wrapper = mountDialog(false);

		expect(wrapper.find('.notice').text()).toBe('wysiwyg_options.paste_warning_body_kept');
		expect(buttons(wrapper).map((button) => button.text())).toEqual(['wysiwyg_options.paste_warning_keep']);

		await buttons(wrapper)[0]!.trigger('click');

		expect(wrapper.emitted('keep')).toHaveLength(1);
		expect(wrapper.emitted('undo')).toBeUndefined();
		expect(wrapper.emitted('raw')).toBeUndefined();
	});

	test('renders the diff line by line', () => {
		const lines = mountDialog(true).findAll('.line');

		expect(lines.map((line) => line.classes().find((cls) => cls.startsWith('line--')))).toEqual([
			'line--context',
			'line--removed',
			'line--added',
			'line--context',
		]);
	});

	test('esc and the apply shortcut count as keeping the paste', () => {
		const wrapper = mountDialog(true);
		const dialog = wrapper.findComponent(VDialog);

		dialog.vm.$emit('esc');
		dialog.vm.$emit('apply');

		expect(wrapper.emitted('keep')).toHaveLength(2);
	});
});
