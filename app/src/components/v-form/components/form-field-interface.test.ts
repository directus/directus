import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import type { FormField } from '@/components/v-form/types';
import { i18n } from '@/lang';

/**
 * The interface is keyed so a genuine comparison/diff switch rebuilds it (see #27907 — the WYSIWYG's
 * ComparisonDiff extension is fixed at construction). But the live main→draft auto-switch (versioning)
 * must NOT remount, or the field loses focus mid-edit (CMS-2871) and drops raw-editing state (CMS-2881).
 */

let mountCount = 0;

const StubInterface = defineComponent({
	name: 'InterfaceStubRemount',
	props: { value: { type: null, default: null } },
	setup() {
		mountCount++;
		return () => h('div', { class: 'stub-interface' });
	},
});

vi.mock('@/composables/use-extension', () => ({
	useExtension: () => ref({}),
}));

const FormFieldInterface = (await import('@/components/v-form/components/form-field-interface.vue')).default;

const baseField = {
	field: 'body',
	name: 'Body',
	collection: 'articles',
	type: 'text',
	meta: { interface: 'stub-remount', options: {} },
	schema: { default_value: null },
} as unknown as FormField;

const global = {
	plugins: [i18n],
	components: { 'interface-stub-remount': StubInterface },
	stubs: {
		VErrorBoundary: { template: '<div><slot /></div>' },
		VNotice: true,
		VSkeletonLoader: true,
		InterfaceSystemRawEditor: true,
	},
};

beforeEach(() => {
	mountCount = 0;
});

describe('form-field-interface remount keying', () => {
	it('does NOT remount the interface on the main→draft version switch (live editing)', async () => {
		const wrapper = mount(FormFieldInterface, {
			props: { field: baseField, version: null },
			global,
		});

		expect(mountCount).toBe(1);

		// main (null) → freshly-created draft ('+'), no comparison context
		await wrapper.setProps({ version: { id: '+', key: 'draft' } as any });

		expect(mountCount).toBe(1);
	});

	it('remounts the interface when the comparison version switches', async () => {
		const wrapper = mount(FormFieldInterface, {
			props: { field: baseField, version: { id: 'v1' } as any, comparison: { side: 'before' } as any },
			global,
		});

		expect(mountCount).toBe(1);

		await wrapper.setProps({ version: { id: 'v2' } as any });

		expect(mountCount).toBe(2);
	});
});
