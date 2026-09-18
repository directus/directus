import type { FlowRaw } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { type FlowDrawerValues, getFlowChanges } from './get-flow-changes';

const existingFlow = {
	id: 'flow-1',
	name: 'Test Flow',
	icon: 'bolt',
	color: null,
	description: null,
	status: 'active',
	trigger: 'event',
	options: { type: 'action' },
	operation: null,
	operations: [],
	date_created: '2026-01-01T00:00:00Z',
	user_created: null,
	accountability: 'all',
} as FlowRaw;

function makeValues(overrides: Partial<FlowDrawerValues> = {}): FlowDrawerValues {
	return {
		name: 'Test Flow',
		icon: 'bolt',
		color: null,
		description: null,
		status: 'active',
		accountability: 'all',
		trigger: 'event',
		options: { type: 'action' },
		...overrides,
	};
}

describe('getFlowChanges', () => {
	test('returns no changes when the values match the existing flow', () => {
		expect(getFlowChanges(makeValues(), existingFlow)).toEqual({});
	});

	test('does not send the unchanged active status of an edited flow', () => {
		const changes = getFlowChanges(makeValues({ name: 'Renamed Flow' }), existingFlow);

		expect(changes).toEqual({ name: 'Renamed Flow' });
		expect(changes).not.toHaveProperty('status');
	});

	test('sends the status when it actually changed', () => {
		expect(getFlowChanges(makeValues({ status: 'inactive' }), existingFlow)).toEqual({ status: 'inactive' });
	});

	test('treats missing existing options as an empty object', () => {
		expect(getFlowChanges(makeValues({ options: {} }), { ...existingFlow, options: null })).toEqual({});
	});

	test('sends changed options', () => {
		expect(getFlowChanges(makeValues({ options: { type: 'filter' } }), existingFlow)).toEqual({
			options: { type: 'filter' },
		});
	});

	test('compares options regardless of key order', () => {
		expect(
			getFlowChanges(makeValues({ options: { b: 2, a: 1 } }), { ...existingFlow, options: { a: 1, b: 2 } }),
		).toEqual({});
	});

	test('sends every changed field and nothing else', () => {
		const changes = getFlowChanges(makeValues({ name: 'New', icon: 'flag', accountability: 'activity' }), existingFlow);

		expect(changes).toEqual({ name: 'New', icon: 'flag', accountability: 'activity' });
	});

	test('ignores fields the user never edited', () => {
		expect(getFlowChanges({ name: 'Renamed Flow' }, existingFlow)).toStrictEqual({ name: 'Renamed Flow' });
	});

	test('drops an edit the user reverted to the existing value', () => {
		expect(getFlowChanges({ name: 'Test Flow', status: 'active' }, existingFlow)).toStrictEqual({});
	});

	test('sends null when a field is cleared', () => {
		expect(getFlowChanges({ description: null }, { ...existingFlow, description: 'Notes' })).toStrictEqual({
			description: null,
		});
	});

	test('sends null when the trigger is cleared', () => {
		expect(getFlowChanges({ trigger: undefined }, existingFlow)).toStrictEqual({ trigger: null });
	});

	test('returns no changes for empty edits', () => {
		expect(getFlowChanges({}, existingFlow)).toStrictEqual({});
	});
});
