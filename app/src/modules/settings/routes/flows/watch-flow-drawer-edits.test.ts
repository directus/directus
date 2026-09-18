import { nextTick, reactive } from 'vue';
import { describe, expect, it } from 'vitest';
import type { FlowDrawerValues } from './get-flow-changes';
import { useFlowDrawerEdits } from './use-flow-drawer-edits';
import { watchFlowDrawerEdits } from './watch-flow-drawer-edits';

/**
 * Integration coverage for the watcher wiring used by flow-drawer.vue. The
 * composable-only tests cannot see the cascade where a trigger-driven options
 * reset re-fires the options-type watcher, so these run the real Vue watchers.
 */
function setup(overrides: Partial<FlowDrawerValues> = {}) {
	const values = reactive<FlowDrawerValues>({
		name: null,
		icon: 'bolt',
		color: null,
		description: null,
		status: 'active',
		accountability: 'all',
		trigger: undefined,
		options: {},
		...overrides,
	});

	const { edits, updateEdit, resetEdits, triggerEdited, optionsTypeEdited } = useFlowDrawerEdits();

	watchFlowDrawerEdits(values, { triggerEdited, optionsTypeEdited });

	function updateField(field: keyof FlowDrawerValues, value: unknown) {
		(values as Record<string, unknown>)[field] = value;
		updateEdit(field, value);
	}

	return { values, edits, updateField, resetEdits };
}

describe('watchFlowDrawerEdits', () => {
	it('keeps a trigger-driven options reset exact, with no nested undefined type', async () => {
		const { values, edits, updateField } = setup({ trigger: 'webhook', options: { type: 'schedule' } });

		updateField('trigger', 'schedule');
		await nextTick();

		expect(edits.trigger).toBe('schedule');
		expect(edits.options).toEqual({});
		expect(Object.keys(edits.options as Record<string, unknown>)).toEqual([]);
		expect(values.options).toEqual({});
		expect(values.options).not.toHaveProperty('type');
	});

	it('still records a genuine options type change', async () => {
		const { values, edits, updateField } = setup({ trigger: 'webhook', options: { type: 'schedule' } });

		updateField('options', { type: 'action' });
		await nextTick();

		expect(edits.options).toEqual({ type: 'action' });
		expect(values.options).toEqual({ type: 'action' });
	});

	it('records options edits after a trigger reset has settled', async () => {
		const { edits, updateField } = setup({ trigger: 'webhook', options: { type: 'schedule' } });

		updateField('trigger', 'schedule');
		await nextTick();

		expect(edits.options).toEqual({});

		updateField('options', { type: 'schedule', cron: '0 0 * * *' });
		await nextTick();

		expect(edits.options).toEqual({ type: 'schedule', cron: '0 0 * * *' });
	});

	it('does not fabricate edits when the drawer is seeded with an existing flow', async () => {
		const { values, edits } = setup();

		values.name = 'Existing flow';
		values.trigger = 'webhook';
		values.options = { type: 'schedule', cron: '0 0 * * *' };
		await nextTick();

		expect(edits).toEqual({});
		expect(values.options).toEqual({ type: 'schedule', cron: '0 0 * * *' });
	});

	it('does not fabricate edits when reseeding from one flow to another', async () => {
		const { values, edits, updateField, resetEdits } = setup({ trigger: 'webhook', options: { type: 'schedule' } });

		updateField('name', 'edited');
		await nextTick();
		expect(edits).toEqual({ name: 'edited' });

		// The primaryKey watcher resets the tracked edits before re-seeding.
		resetEdits();
		values.name = 'Other flow';
		values.trigger = 'schedule';
		values.options = { type: 'action' };
		await nextTick();

		expect(edits).toEqual({});
	});
});
