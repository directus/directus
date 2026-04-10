import type { Type } from '@directus/types';
import { expect, test } from 'vitest';
import { validateOperator } from './validate-operator.js';

test(`_eq allowed on boolean`, async () => {
	expect(() => {
		validateOperator('boolean', '_eq');
	}).not.toThrowError();
});

test(`_intersects_bbox allowed on geometry.Point`, async () => {
	expect(() => {
		validateOperator('geometry.Point', '_intersects_bbox');
	}).not.toThrowError();
});

// test(`_nintersects_bbox allowed on geometry.Point`, async () => {
// 	expect(() => {
// 		validateOperator('geometry.Point', '_nintersects_bbox');
// 	}).not.toThrowError();
// });

test(`_intersects_bbox allowed on geography.Point`, async () => {
	expect(() => {
		validateOperator('geography.Point' as unknown as Type, '_intersects_bbox');
	}).not.toThrowError();
});

// test(`_nintersects_bbox allowed on geography.Point`, async () => {
// 	expect(() => {
// 		validateOperator('geography.Point' as unknown as Type, '_nintersects_bbox');
// 	}).not.toThrowError();
// });

test(`_contains allowed on integer`, async () => {
	expect(() => {
		validateOperator('integer', '_contains');
	}).toThrowError(`Invalid query. "integer" field type does not contain the "_contains" filter operator.`);
});

test(`_contains allowed on concealed string`, async () => {
	expect(() => {
		validateOperator('string', '_contains', ['conceal']);
	}).toThrowError(`Invalid query. Field with "conceal" special does not allow the "_contains" filter operator.`);
});
