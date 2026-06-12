import formatTitle from '@directus/format-title';
import type { FlowRaw, Item, PrimaryKey } from '@directus/types';
import { type Ref, unref } from 'vue';

export interface ManualFlowConfirmDetails {
	description: any;
	fields: Record<string, any>[];
}

interface ManualFlowPayloadOptions {
	flow: FlowRaw;
	collection: string;
	location: 'collection' | 'item';
	primaryKey?: Ref<PrimaryKey | null>;
	selection: Ref<Item[]>;
	values: Record<string, any> | null;
}

interface TriggerManualFlowOptions extends ManualFlowPayloadOptions {
	api: {
		post: (url: string, body: Record<string, any>) => Promise<unknown>;
	};
}

export function getManualFlowConfirmDetails(flow: FlowRaw | null | undefined): ManualFlowConfirmDetails | null {
	if (!flow?.options?.requireConfirmation) return null;

	return {
		description: flow.options.confirmationDescription,
		fields: (flow.options.fields ?? []).map((field: Record<string, any>) => ({
			...field,
			name: !field.name && field.field ? formatTitle(field.field) : field.name,
		})),
	};
}

export function isManualFlowConfirmButtonDisabled(
	currentFlowId: string | null,
	confirmDetails: ManualFlowConfirmDetails | null,
	confirmValues: Record<string, any> | null,
) {
	if (!currentFlowId) return true;

	for (const field of confirmDetails?.fields || []) {
		if (
			field.meta?.required &&
			(!confirmValues || confirmValues[field.field] === null || confirmValues[field.field] === undefined)
		) {
			return true;
		}
	}

	return false;
}

export function getManualFlowTriggerPayload({
	flow,
	collection,
	location,
	primaryKey,
	selection,
	values,
}: ManualFlowPayloadOptions) {
	if (location === 'collection' && flow.options?.requireSelection === false && selection.value.length === 0) {
		return {
			...(values ?? {}),
			collection,
		};
	}

	const pk = unref(primaryKey);
	const keys = pk ? [pk] : selection.value || [];

	return {
		...values,
		collection,
		keys,
	};
}

export function triggerManualFlow({ api, flow, ...options }: TriggerManualFlowOptions) {
	return api.post(`/flows/trigger/${flow.id}`, getManualFlowTriggerPayload({ flow, ...options }));
}

export function canRunManualFlowFromCommandPalette(flow: FlowRaw, location: 'collection' | 'item') {
	return location === 'item' || flow.options?.requireSelection === false;
}
