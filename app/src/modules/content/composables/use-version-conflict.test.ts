import type { Item } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { ref } from 'vue';
import { useVersionConflict } from './use-version-conflict';

const conflict = (fields: string[]) => Object.assign(new Error('Conflict'), { versionConflict: { fields } });

function setup(edits: Item, item: Item = { id: 1, title: 'Saved elsewhere', body: 'Saved elsewhere' }) {
	const editsRef = ref<Item>(edits);
	const itemRef = ref<Item | null>(item);

	return { edits: editsRef, item: itemRef, ...useVersionConflict(editsRef, itemRef) };
}

describe('useVersionConflict', () => {
	test('should ignore errors that are not version conflicts', () => {
		const { edits, versionConflict, handleVersionConflict } = setup({ title: 'Mine' });

		expect(handleVersionConflict(new Error('Network Error'))).toBe(false);
		expect(handleVersionConflict(null)).toBe(false);
		expect(edits.value).toEqual({ title: 'Mine' });
		expect(versionConflict.value).toBeUndefined();
	});

	test('should hold back the conflicting edits so they are not auto-saved', () => {
		const { edits, handleVersionConflict } = setup({ title: 'Mine', status: 'draft' });

		expect(handleVersionConflict(conflict(['title']))).toBe(true);
		expect(edits.value).toEqual({ status: 'draft' });
	});

	test('should compare the latest saved values with the held back edits', () => {
		const { versionConflict, handleVersionConflict } = setup({ title: 'Mine', status: 'draft' });

		handleVersionConflict(conflict(['title']));

		expect(versionConflict.value).toEqual({
			from: { id: 1, title: 'Saved elsewhere', body: 'Saved elsewhere', status: 'draft' },
			to: { id: 1, title: 'Mine', body: 'Saved elsewhere', status: 'draft' },
		});
	});

	test('should collect conflicts that happen while one is still open', () => {
		const { edits, versionConflict, handleVersionConflict } = setup({ title: 'Mine' });

		handleVersionConflict(conflict(['title']));
		edits.value = { body: 'Mine too' };
		handleVersionConflict(conflict(['body']));

		expect(edits.value).toEqual({});
		expect(versionConflict.value?.to).toMatchObject({ title: 'Mine', body: 'Mine too' });
	});

	test('should not open a conflict when the edits for those fields are already gone', () => {
		const { edits, versionConflict, handleVersionConflict } = setup({ status: 'draft' });

		expect(handleVersionConflict(conflict(['title']))).toBe(true);
		expect(edits.value).toEqual({ status: 'draft' });
		expect(versionConflict.value).toBeUndefined();
	});

	test('should drop the held back edits when cleared', () => {
		const { edits, versionConflict, handleVersionConflict, clearVersionConflict } = setup({ title: 'Mine' });

		handleVersionConflict(conflict(['title']));
		clearVersionConflict();

		expect(versionConflict.value).toBeUndefined();
		expect(edits.value).toEqual({});
	});
});
