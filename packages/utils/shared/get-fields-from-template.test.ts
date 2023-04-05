import { describe, expect, it } from 'vitest';
import { getFieldsFromTemplate } from './get-fields-from-template.js';

describe('getFieldsFromTemplate', () => {
	it('returns an empty array when passed null', () => {
		expect(getFieldsFromTemplate(null)).toStrictEqual([]);
	});

	it('returns fields as an array of strings', () => {
		expect(getFieldsFromTemplate('{{ field }}')).toStrictEqual(['field']);
	});
});
