import { getFieldsFromTemplate } from './get-fields-from-template.js';
import { describe, expect, it } from 'vitest';

describe('getFieldsFromTemplate', () => {
	it('returns an empty array when no value passed', () => {
		expect(getFieldsFromTemplate('')).toStrictEqual([]);
		expect(getFieldsFromTemplate(undefined)).toStrictEqual([]);
		expect(getFieldsFromTemplate(null)).toStrictEqual([]);
	});

	it('returns fields as an array of strings', () => {
		expect(getFieldsFromTemplate('{{ field }}')).toStrictEqual(['field']);
	});
});
