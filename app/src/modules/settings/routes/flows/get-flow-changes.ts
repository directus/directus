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
 * The Flows API asserts the flows license entitlement whenever an update
 * payload contains `status: 'active'`, even when the status did not change.
 * Sending only the fields that actually changed keeps a plain edit of an
 * active flow from being mistaken for an activation.
 * See https://github.com/directus/directus/issues/28184
 */
export function getFlowChanges(values: FlowDrawerValues, existing: FlowRaw): Partial<FlowDrawerValues> {
	const fields = ['name', 'icon', 'color', 'description', 'status', 'accountability', 'trigger', 'options'] as const;

	const changes: Partial<FlowDrawerValues> = {};

	for (const field of fields) {
		const fallback = field === 'options' ? {} : null;
		const newValue = values[field] ?? fallback;
		const existingValue = existing[field] ?? fallback;

		if (!isEqual(newValue, existingValue)) {
			(changes as Record<string, unknown>)[field] = values[field];
		}
	}

	return changes;
}
