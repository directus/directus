import type { Field } from '@directus/types';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import ListInline from './list-inline.vue';
import type { GlobalMountOptions } from '@/__utils__/types.d.ts';
import { i18n } from '@/lang';

const fields = [
	{ field: 'title', name: 'Title', type: 'string', meta: null, schema: { default_value: 'a' } },
] as unknown as Field[];

const global: GlobalMountOptions = {
	stubs: {
		VForm: { props: ['modelValue'], template: '<div><input class="title-input" :value="modelValue?.title" /></div>' },
		VListItem: { template: '<div><slot /></div>' },
		VButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
		TransitionExpand: { template: '<div><slot /></div>' },
		RenderTemplate: true,
		VRemove: true,
		VIcon: true,
		VNotice: true,
	},
	plugins: [i18n],
	directives: {
		tooltip: () => {},
	},
};

let wrapper: VueWrapper | undefined;

afterEach(() => {
	wrapper?.unmount();
	wrapper = undefined;
	document.body.innerHTML = '';
});

async function addRow(value: Record<string, unknown>[] | null, sort?: string) {
	const mounted = mount(ListInline, {
		props: {
			value,
			fields,
			sort,
			onInput: (next: Record<string, unknown>[] | null) => mounted.setProps({ value: next }),
		},
		global,
		attachTo: document.body,
	});

	wrapper = mounted;

	await mounted.find('.add-new').trigger('click');
	await flushPromises();

	return mounted;
}

describe('list-inline', () => {
	it.each([
		['the first row', null],
		['a row after existing ones', [{ title: 'm' }, { title: 'z' }]],
	])('focuses the new row when adding %s', async (_, value) => {
		const list = await addRow(value);

		const inputs = list.findAll('.title-input');

		expect(document.activeElement).toBe(inputs.at(-1)!.element);
	});

	it('focuses the new row, not the last one, when the list is sorted', async () => {
		const list = await addRow([{ title: 'm' }, { title: 'z' }], 'title');

		const focused = document.activeElement as HTMLInputElement;

		expect(list.findAll('.title-input').map((input) => input.element)).toContain(focused);
		expect(focused.value).toBe('a');
	});
});
