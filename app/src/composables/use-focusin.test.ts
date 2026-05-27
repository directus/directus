import { describe, expect, test, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { useFocusin } from './use-focusin';

describe('useFocusin', () => {
	test('dispatches focus and focusin when active becomes true', async () => {
		const el = document.createElement('div');
		const active = ref(false);

		const focusSpy = vi.fn();
		const focusinSpy = vi.fn();

		el.addEventListener('focus', focusSpy);
		el.addEventListener('focusin', focusinSpy);

		useFocusin(el, active);

		active.value = true;
		await nextTick();

		expect(focusSpy).toHaveBeenCalled();
		expect(focusinSpy).toHaveBeenCalled();
		expect(focusinSpy.mock.calls[0]![0].bubbles).toBe(true);
	});

	test('dispatches blur and focusout when active becomes false', async () => {
		const el = document.createElement('div');
		const active = ref(true);

		const blurSpy = vi.fn();
		const focusoutSpy = vi.fn();

		el.addEventListener('blur', blurSpy);
		el.addEventListener('focusout', focusoutSpy);

		useFocusin(el, active);

		active.value = false;
		await nextTick();

		expect(blurSpy).toHaveBeenCalled();
		expect(focusoutSpy).toHaveBeenCalled();
		expect(focusoutSpy.mock.calls[0]![0].bubbles).toBe(true);
	});

	test('manual focus and blur calls dispatch correct events', () => {
		const el = document.createElement('div');
		const focusSpy = vi.fn();
		const blurSpy = vi.fn();

		el.addEventListener('focus', focusSpy);
		el.addEventListener('blur', blurSpy);

		const { focus, blur } = useFocusin(el);

		focus();
		expect(focusSpy).toHaveBeenCalled();

		blur();
		expect(blurSpy).toHaveBeenCalled();
	});

	test('handles component instances via $el', () => {
		const el = document.createElement('div');
		const focusSpy = vi.fn();
		el.addEventListener('focus', focusSpy);

		const vm = { $el: el };
		const { focus } = useFocusin(vm as any);

		focus();
		expect(focusSpy).toHaveBeenCalled();
	});

	test('does not dispatch if reference is null', async () => {
		const el = document.createElement('div');
		const dispatchSpy = vi.spyOn(el, 'dispatchEvent');
		const reference = ref<HTMLElement | null>(null);

		const { focus, blur } = useFocusin(reference);

		focus();
		blur();

		expect(dispatchSpy).not.toHaveBeenCalled();

		// Should work once ref is populated
		reference.value = el;
		await nextTick();

		focus();
		expect(dispatchSpy).toHaveBeenCalled();
	});
});
