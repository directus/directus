import { describe, expect, test } from 'vitest';
import { applyFormValues, mergeFileIds } from './operation-options';

describe('applyFormValues', () => {
	test("sets the form's values and drops keys that went back to their default", () => {
		const fields = [{ field: 'prompt' }, { field: 'model' }] as any;

		expect(applyFormValues({ prompt: 'old', model: 'a', other: 1 }, fields, { prompt: 'new' })).toEqual({
			prompt: 'new',
			other: 1,
		});
	});
});

describe('mergeFileIds', () => {
	test('adds picked ids once', () => {
		expect(mergeFileIds(['a'], ['a', 'b', 3])).toEqual(['a', 'b', '3']);
	});

	test('starts a new list when the value is a {{ }} template', () => {
		expect(mergeFileIds('{{ $trigger.keys }}', ['a'])).toEqual(['a']);
	});
});
