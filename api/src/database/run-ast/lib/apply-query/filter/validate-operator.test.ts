import { validateOperator } from './validate-operator.js';
import { expect, test } from 'vitest';

test(`_eq allowed on boolean`, async () => {
	expect(() => {
		validateOperator('boolean', '_eq');
	}).not.toThrowError();
});

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
