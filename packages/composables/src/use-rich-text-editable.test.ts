import { RICHTEXT_EDITABLE_INJECT } from '@directus/constants';
import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { defineComponent, h, nextTick, type Ref, ref } from 'vue';
import { useRichTextEditable } from './use-rich-text-editable.js';

function mountWith(provided?: Ref<boolean>) {
	let editable: Readonly<Ref<boolean>> | undefined;

	const Child = defineComponent({
		setup() {
			editable = useRichTextEditable();
			return () => h('div');
		},
	});

	mount(defineComponent({ render: () => h(Child) }), {
		global: { provide: provided ? { [RICHTEXT_EDITABLE_INJECT]: provided } : {} },
	});

	return editable!;
}

describe('useRichTextEditable', () => {
	test('returns the editable state the rich text interface provides', () => {
		expect(mountWith(ref(false)).value).toBe(false);
	});

	test('follows the provided state when the field locks after mount', async () => {
		const provided = ref(true);
		const editable = mountWith(provided);

		provided.value = false;
		await nextTick();
		expect(editable.value).toBe(false);
	});

	// a node view in an editor the extension built itself has no field state to follow
	test('returns true outside the rich text interface', () => {
		expect(mountWith().value).toBe(true);
	});
});
