import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { editorExtensions } from '../../extensions';
import DateTimeMenu from './datetime-menu.vue';

const global = {
	plugins: [createI18n({ legacy: false })],
	directives: { tooltip: {} },
	stubs: { VMenu: true, VButton: true, VIcon: true, VList: true, VListItem: true, VListItemContent: true },
};

const FIXED_DATE = new Date(2024, 4, 15, 13, 45, 7);

let editor: Editor;

beforeEach(() => {
	vi.useFakeTimers({ now: FIXED_DATE, toFake: ['Date'] });
	editor = new Editor({ extensions: editorExtensions, content: '<p>hello </p>' });
	editor.commands.focus('end');
});

afterEach(() => {
	editor.destroy();
	vi.useRealTimers();
});

interface Format {
	labelKey: string;
	build: (date: Date) => string;
}

describe('datetime-menu', () => {
	test.each([
		['date', 0, '2024-05-15'],
		['time', 1, '13:45:07'],
		['datetime', 2, '2024-05-15 13:45:07'],
		['locale', 3, FIXED_DATE.toLocaleString('en-US')],
	])('insert drops the %s format into the document', (_label, index, expected) => {
		const wrapper = mount(DateTimeMenu, { props: { editor }, global });
		const vm = wrapper.vm as unknown as { insert: (f: Format) => void; FORMATS: Format[] };

		vm.insert(vm.FORMATS[index]!);

		expect(editor.getText()).toContain(expected);
	});

	test('locale format follows the app locale rather than the runtime default', () => {
		const wrapper = mount(DateTimeMenu, {
			props: { editor },
			global: { ...global, plugins: [createI18n({ legacy: false, locale: 'de-DE' })] },
		});

		const vm = wrapper.vm as unknown as { insert: (f: Format) => void; FORMATS: Format[] };

		vm.insert(vm.FORMATS[3]!);

		expect(editor.getText()).toContain(FIXED_DATE.toLocaleString('de-DE'));
	});
});
