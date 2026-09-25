import type { FlowDrawerValues } from './get-flow-changes';

/**
 * Tracks the fields the user actually edited in the flow drawer, so saving
 * never sends untouched fields back to the API. The Flows API asserts the
 * flows license entitlement whenever an update payload contains
 * `status: 'active'`, so resending unchanged fields is not an option.
 * See https://github.com/directus/directus/issues/28184
 */
export function useFlowDrawerEdits() {
	/** Fields the user changed since the last reset. Consumed imperatively on save, so it needs no reactivity. */
	const edits: Partial<FlowDrawerValues> = {};

	/** Records a field the user edited. */
	function updateEdit(field: keyof FlowDrawerValues, value: unknown) {
		(edits as Record<string, unknown>)[field] = value;
	}

	/** Clears all tracked edits, e.g. when the drawer targets another flow. */
	function resetEdits() {
		for (const field of Object.keys(edits)) {
			delete (edits as Record<string, unknown>)[field];
		}
	}

	/**
	 * Records the options reset that follows a trigger change. Only tracked when the
	 * trigger change itself was a user edit, so re-seeding the drawer with an
	 * existing flow never fabricates edits.
	 */
	function triggerEdited() {
		if ('trigger' in edits) {
			edits.options = {};
		}
	}

	/**
	 * Records the options reset that follows an options type change. Only tracked
	 * when the options change itself was a user edit.
	 */
	function optionsTypeEdited(type: unknown) {
		if ('options' in edits) {
			edits.options = { type };
		}
	}

	return { edits, updateEdit, resetEdits, triggerEdited, optionsTypeEdited };
}
