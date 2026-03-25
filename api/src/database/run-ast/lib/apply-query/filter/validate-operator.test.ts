import { expect, test } from 'vitest';
import { validateOperator } from './validate-operator.js';

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

test(`_contains allowed on json`, async () => {
	expect(() => {
		validateOperator('json', '_contains');
	}).not.toThrowError();
});

test(`_ncontains allowed on json`, async () => {
	expect(() => {
		validateOperator('json', '_ncontains');
	}).not.toThrowError();
});

test(`_icontains allowed on json`, async () => {
	expect(() => {
		validateOperator('json', '_icontains');
	}).not.toThrowError();
});

test(`_nicontains allowed on json`, async () => {
	expect(() => {
		validateOperator('json', '_nicontains');
	}).not.toThrowError();
});

test(`_nicontains allowed on string`, async () => {
	expect(() => {
		validateOperator('string', '_nicontains');
	}).not.toThrowError();
});
