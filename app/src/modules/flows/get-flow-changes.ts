import type { FlowRaw, TriggerType } from '@directus/types';
import { isEqual } from 'lodash-es';

export interface FlowDrawerValues {
	name: string | null;
	icon: string | null;
	color: string | null;
	description: string | null;
	status: string;
	accountability: string | null;
	trigger?: TriggerType | null;
	options: Record<string, any>;
}

/**
 * The flow drawer tracks the fields the user actually edited (see
 * flow-drawer.vue), and this drops any edit that was reverted back to the
 * existing value, so the update payload never carries an unchanged field.
 * The Flows API asserts the flows license entitlement whenever an update
 * payload contains `status: 'active'`, even when the status did not change,
 * so a plain edit of an active flow must not resend the status.
 * See https://github.com/directus/directus/issues/28184
 */
export function getFlowChanges(edits: Partial<FlowDrawerValues>, existing: FlowRaw): Partial<FlowDrawerValues> {
	const changes: Partial<FlowDrawerValues> = {};

	for (const field of Object.keys(edits) as (keyof FlowDrawerValues)[]) {
		const fallback = field === 'options' ? {} : null;
		const newValue = edits[field] ?? fallback;
		const existingValue = existing[field] ?? fallback;

		if (!isEqual(newValue, existingValue)) {
			(changes as Record<string, unknown>)[field] = newValue;
		}
	}

	return changes;
}
