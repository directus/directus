import type { FlowRaw } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { getFlowChanges } from './get-flow-changes';
import { useFlowDrawerEdits } from './use-flow-drawer-edits';

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

describe('useFlowDrawerEdits', () => {
	test('starts empty, and reseeding the drawer leaves it empty', () => {
		const { edits, resetEdits, updateEdit } = useFlowDrawerEdits();

		expect(edits).toStrictEqual({});

		updateEdit('name', 'Edited');
		resetEdits();

		expect(edits).toStrictEqual({});
	});

	test('a user trigger change records the trigger and the options reset', () => {
		const { edits, updateEdit, triggerEdited } = useFlowDrawerEdits();

		updateEdit('trigger', 'webhook');
		triggerEdited();

		expect(edits).toStrictEqual({ trigger: 'webhook', options: {} });
	});

	test('a programmatic trigger reseed does not fabricate edits', () => {
		const { edits, triggerEdited } = useFlowDrawerEdits();

		triggerEdited();

		expect(edits).toStrictEqual({});
	});

	test('an options type edit records the pruned options', () => {
		const { edits, updateEdit, optionsTypeEdited } = useFlowDrawerEdits();

		updateEdit('options', { type: 'filter', keys: ['title'] });
		optionsTypeEdited('filter');

		expect(edits).toStrictEqual({ options: { type: 'filter' } });
	});

	test('an options type change without a user options edit records nothing', () => {
		const { edits, optionsTypeEdited } = useFlowDrawerEdits();

		optionsTypeEdited('filter');

		expect(edits).toStrictEqual({});
	});

	test('all eight drawer controls feed sparse edits', () => {
		const { edits, updateEdit } = useFlowDrawerEdits();

		updateEdit('name', 'New');
		updateEdit('status', 'inactive');
		updateEdit('description', 'Desc');
		updateEdit('icon', 'flag');
		updateEdit('color', '#6644ff');
		updateEdit('accountability', 'activity');
		updateEdit('trigger', 'schedule');
		updateEdit('options', { type: 'interval' });

		expect(Object.keys(edits).sort()).toStrictEqual([
			'accountability',
			'color',
			'description',
			'icon',
			'name',
			'options',
			'status',
			'trigger',
		]);
	});

	test('saving sends only the sparse edits that still differ', () => {
		const { edits, updateEdit } = useFlowDrawerEdits();

		updateEdit('name', 'Renamed Flow');
		updateEdit('status', 'active');

		const changes = getFlowChanges(edits, existingFlow);

		expect(changes).toStrictEqual({ name: 'Renamed Flow' });
		expect(Object.keys(changes)).toStrictEqual(['name']);
	});

	test('no edits means no payload, so save skips the request', () => {
		const { edits } = useFlowDrawerEdits();

		const changes = getFlowChanges(edits, existingFlow);

		expect(changes).toStrictEqual({});
		expect(Object.keys(changes)).toHaveLength(0);
	});

	test('every change value is defined, so the payload never serializes to an empty body', () => {
		const { edits, updateEdit } = useFlowDrawerEdits();

		updateEdit('trigger', undefined);
		updateEdit('description', null);

		const changes = getFlowChanges(edits, { ...existingFlow, description: 'Notes' });

		expect(Object.values(changes).every((value) => value !== undefined)).toBe(true);
		expect(changes).toStrictEqual({ trigger: null, description: null });
	});
});
