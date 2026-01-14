import { describe, expect, test, vi } from 'vitest';
import { applyConditions } from './apply-conditions';
import type { Field } from '@directus/types';

vi.mock('@/utils/parse-filter', () => ({
	parseFilter: vi.fn((filter) => filter),
}));

vi.mock('@directus/utils', () => ({
	validatePayload: vi.fn((rule, context, _options) => {
		// Simple mock that validates basic equality conditions
		const errors: any[] = [];
		const checkRule = (ruleObj: Record<string, any>, ctx: Record<string, any>, path = '') => {
			for (const [key, value] of Object.entries(ruleObj)) {
				if (key.startsWith('_')) {
					// Operator - check the value
					if (key === '_eq') {
						const contextValue = path.split('.').reduce((obj, k) => obj?.[k], ctx);
						if (contextValue !== value) {
							errors.push({ field: path, type: 'invalid' });
						}
					}
				} else {
					// Field path
					const newPath = path ? `${path}.${key}` : key;
					if (typeof value === 'object' && value !== null) {
						checkRule(value, ctx, newPath);
					}
				}
			}
		};
		checkRule(rule, context);
		return errors;
	}),
}));

describe('applyConditions', () => {
	const createField = (conditions: any[] = []): Field =>
		({
			field: 'test_field',
			type: 'string',
			meta: {
				conditions,
				hidden: false,
				readonly: false,
				required: false,
			},
			schema: null,
		}) as unknown as Field;

	test('returns field unchanged when no conditions', () => {
		const field = createField([]);
		const result = applyConditions({}, field);
		expect(result).toEqual(field);
	});

	test('applies condition based on item field value', () => {
		const field = createField([
			{
				rule: { status: { _eq: 'published' } },
				readonly: true,
				hidden: false,
				required: false,
			},
		]);

		const result = applyConditions({ status: 'published' }, field);
		expect(result.meta?.readonly).toBe(true);
	});

	test('applies condition based on $version', () => {
		const field = createField([
			{
				rule: { $version: { _eq: 'draft' } },
				hidden: true,
				readonly: false,
				required: false,
			},
		]);

		const result = applyConditions({}, field, { name: 'draft' } as any);
		expect(result.meta?.hidden).toBe(true);
	});

	test('applies condition based on $form (parent form values)', () => {
		const field = createField([
			{
				rule: { '$form.program': { _eq: 'program-123' } },
				hidden: false,
				readonly: false,
				required: true,
			},
		]);

		const parentFormValues = { program: 'program-123' };
		const result = applyConditions({}, field, null, parentFormValues);
		expect(result.meta?.required).toBe(true);
	});

	test('$form condition does not match when parent value differs', () => {
		const field = createField([
			{
				rule: { '$form.program': { _eq: 'program-123' } },
				hidden: true,
				readonly: false,
				required: false,
			},
		]);

		const parentFormValues = { program: 'different-program' };
		const result = applyConditions({}, field, null, parentFormValues);
		// Condition should not match, so field remains unchanged
		expect(result.meta?.hidden).toBe(false);
	});

	test('$form defaults to empty object when not provided', () => {
		const field = createField([
			{
				rule: { '$form.program': { _eq: 'program-123' } },
				hidden: true,
				readonly: false,
				required: false,
			},
		]);

		const result = applyConditions({}, field, null, null);
		// Condition should not match with empty $form
		expect(result.meta?.hidden).toBe(false);
	});

	test('combines item values, $version, and $form in validation context', () => {
		const field = createField([
			{
				rule: { status: { _eq: 'active' } },
				readonly: true,
				hidden: false,
				required: false,
			},
		]);

		const item = { status: 'active' };
		const version = { name: 'main' } as any;
		const parentFormValues = { program: 'test' };

		const result = applyConditions(item, field, version, parentFormValues);
		expect(result.meta?.readonly).toBe(true);
	});

	test('backward compatibility: works without parentFormValues parameter', () => {
		const field = createField([
			{
				rule: { status: { _eq: 'published' } },
				readonly: true,
				hidden: false,
				required: false,
			},
		]);

		// Only passing item and field (old signature)
		const result = applyConditions({ status: 'published' }, field);
		expect(result.meta?.readonly).toBe(true);
	});
});
