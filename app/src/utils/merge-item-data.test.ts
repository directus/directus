import { describe, it, expect } from 'vitest';
import { mergeItemData } from './merge-item-data';

describe('mergeItemData', () => {
	it('should use existing if edits is undefined', () => {
		const defaults = { x: 'default' };
		const existing = { x: 'existing' };
		const edits = {};
		const result = mergeItemData(defaults, existing, edits);
		expect(result.x).toMatchInlineSnapshot(`"existing"`);
	});

	it('should use default if both existing and edits are undefined', () => {
		const defaults = { x: 'default' };
		const existing = {};
		const edits = {};
		const result = mergeItemData(defaults, existing, edits);
		expect(result.x).toMatchInlineSnapshot(`"default"`);
	});

	it('should use edits over existing and default', () => {
		const defaults = { x: 'default' };
		const existing = { x: 'existing' };
		const edits = { x: 'edited' };
		const result = mergeItemData(defaults, existing, edits);
		expect(result.x).toMatchInlineSnapshot(`"edited"`);
	});

	it('should merge default, existing, and edits with correct precedence', () => {
		const defaults = { b: 'default b', c: 'default c' };
		const existing = { a: 'existing a', b: 'existing b', d: 'existing d' };
		const edits = { b: 'edit b', e: 'edit e' };
		const result = mergeItemData(defaults, existing, edits);

		expect(result).toMatchInlineSnapshot(`
			{
			  "a": "existing a",
			  "b": "edit b",
			  "c": "default c",
			  "d": "existing d",
			  "e": "edit e",
			}
		`);
	});

	it('should not merge nested objects', () => {
		const defaults = { obj: { a: 1, b: 2 } };
		const existing = { obj: { b: 3 } };
		const edits = { obj: { c: 4 } };
		const result = mergeItemData(defaults, existing, edits);

		expect(result.obj).toMatchInlineSnapshot(`
			{
			  "c": 4,
			}
		`);
	});

	it('should not merge nested arrays', () => {
		const defaults = { arr: [1, 2, 3] };
		const existing = { arr: [4, 5] };
		const edits = { arr: [6] };
		const result = mergeItemData(defaults, existing, edits);

		expect(result.arr).toMatchInlineSnapshot(`
			[
			  6,
			]
		`);
	});

	it('should handle null and undefined values correctly', () => {
		const defaults = { a: 'default a', b: 'default b' };
		const existing = { a: null };
		const edits = { b: undefined };
		const result = mergeItemData(defaults, existing, edits);

		expect(result).toMatchInlineSnapshot(`
			{
			  "a": null,
			  "b": "default b",
			}
		`);
	});
});
