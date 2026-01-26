import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { computed, ComputedRef, ref } from 'vue';
import { isSaveAllowed } from './is-save-allowed';

const createAllowedSpy = vi.fn();
let createAllowed: ComputedRef<boolean>;
const updateAllowedSpy = vi.fn();
let updateAllowed: ComputedRef<boolean>;

beforeEach(() => {
	createAllowed = computed(() => {
		createAllowedSpy();
		return true;
	});

	updateAllowed = computed(() => {
		updateAllowedSpy();
		return true;
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

it('should consider the create allowed state for new item', () => {
	const isNew = ref(true);

	const result = isSaveAllowed(isNew, createAllowed, updateAllowed);

	expect(result.value).toBe(true);
	expect(createAllowedSpy).toHaveBeenCalled();
	expect(updateAllowedSpy).not.toHaveBeenCalled();
});

it('should consider the update allowed state for existing item', () => {
	const isNew = ref(false);

	const result = isSaveAllowed(isNew, createAllowed, updateAllowed);

	expect(result.value).toBe(true);
	expect(createAllowedSpy).not.toHaveBeenCalled();
	expect(updateAllowedSpy).toHaveBeenCalled();
});
