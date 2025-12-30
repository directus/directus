import { computed, reactive, type ComputedRef } from 'vue';
import type { FieldValues } from '@/components/v-form/types';

/**
 * A reactive stack of parent form values used to provide $form context
 * to nested forms opened in drawers/modals (which use teleport and break provide/inject).
 *
 * Each nested form adds its parent's values to the stack on mount,
 * and removes them on unmount. The top of the stack represents
 * the immediate parent form's values.
 */

interface FormContextEntry {
	id: symbol;
	values: FieldValues;
}

const contextStack = reactive<FormContextEntry[]>([]);

/**
 * Push a new parent form context onto the stack.
 * Returns an ID that must be used to remove it later.
 */
export function pushFormContext(values: FieldValues): symbol {
	const id = Symbol('form-context');
	contextStack.push({ id, values });
	return id;
}

/**
 * Remove a parent form context from the stack by its ID.
 */
export function popFormContext(id: symbol): void {
	const index = contextStack.findIndex((entry) => entry.id === id);
	if (index !== -1) {
		contextStack.splice(index, 1);
	}
}

/**
 * Update the values for an existing context entry.
 * This is called when the parent form values change.
 */
export function updateFormContext(id: symbol, values: FieldValues): void {
	const entry = contextStack.find((e) => e.id === id);
	if (entry) {
		entry.values = values;
	}
}

/**
 * Get the current parent form values (top of the stack).
 * Returns an empty object if no parent form context exists.
 */
export function useParentFormContext(): ComputedRef<FieldValues> {
	return computed(() => {
		if (contextStack.length === 0) {
			return {};
		}
		// Return the top of the stack (most recent parent)
		return contextStack[contextStack.length - 1]?.values ?? {};
	});
}


