import { watch, type WatchStopHandle } from 'vue';
import type { FlowDrawerValues } from './get-flow-changes';

export interface FlowDrawerEditHooks {
	triggerEdited: () => void;
	optionsTypeEdited: (type: unknown) => void;
}

/**
 * Wires the flow drawer's reset watchers to edit tracking. A trigger change
 * resets the options, which re-fires the options-type watcher with an
 * undefined type; that cascade is part of the reset, not a user edit, so it
 * must not overwrite the clean `{}` reset with `{ type: undefined }`.
 */
export function watchFlowDrawerEdits(values: FlowDrawerValues, hooks: FlowDrawerEditHooks): WatchStopHandle[] {
	const stopTrigger = watch(
		() => values.trigger,
		(_, previousTrigger) => {
			if (previousTrigger === undefined) return;

			values.options = {};

			hooks.triggerEdited();
		},
	);

	const stopOptionsType = watch(
		() => values.options?.type,
		(type, previousType) => {
			// Undefined means the options were just reset (e.g. by the trigger
			// watcher above), not that the user cleared the type.
			if (type === undefined) return;

			if (previousType === undefined) return;

			values.options = {
				type,
			};

			hooks.optionsTypeEdited(type);
		},
	);

	return [stopTrigger, stopOptionsType];
}
