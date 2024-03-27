import type { FilterOperator } from '@directus/types';
import { describe, expect, test } from 'vitest';
import { messageConstructor } from './failed-validation.js';

/** Can't be randomized, as we're using snapshot tests */
const field = 'test_field';

describe('No value', () => {
	const types: (FilterOperator | 'required' | 'regex')[] = ['null', 'nnull', 'empty', 'nempty', 'required', 'regex'];

	test.each(types)('Constructs message for "%s"', (type) => {
		const message = messageConstructor({ field, type });
		expect(message).toMatchSnapshot();
	});
});

describe('Valid value (primitive)', () => {
	const types: FilterOperator[] = ['eq', 'lt', 'lte', 'gt', 'gte'];

	/** Can't be randomized, as we're using snapshot tests */
	const valid = 15;

	test.each(types)('Constructs message for "%s"', (type) => {
		const message = messageConstructor({ field, type, valid });
		expect(message).toMatchSnapshot();
	});
});

describe('Valid value (list)', () => {
	const types: FilterOperator[] = ['in'];

	/** Can't be randomized, as we're using snapshot tests */
	const valid = ['valA', 'valB', 'valC'];

	test.each(types)('Constructs message for "%s"', (type) => {
		const message = messageConstructor({ field, type, valid });
		expect(message).toMatchSnapshot();
	});
});

describe('Invalid value (primitive)', () => {
	const types: FilterOperator[] = ['neq'];

	/** Can't be randomized, as we're using snapshot tests */
	const invalid = 15;

	test.each(types)('Constructs message for "%s"', (type) => {
		const message = messageConstructor({ field, type, invalid });
		expect(message).toMatchSnapshot();
	});
});

describe('Invalid value (list)', () => {
	const types: FilterOperator[] = ['nin'];

	/** Can't be randomized, as we're using snapshot tests */
	const invalid = ['valA', 'valB', 'valC'];

	test.each(types)('Constructs message for "%s"', (type) => {
		const message = messageConstructor({ field, type, invalid });
		expect(message).toMatchSnapshot();
	});
});

describe('Substring', () => {
	const types: FilterOperator[] = ['contains', 'icontains', 'ncontains'];

	/** Can't be randomized, as we're using snapshot tests */
	const substring = 'test_substring';

	test.each(types)('Constructs message for "%s"', (type) => {
		const message = messageConstructor({ field, type, substring });
		expect(message).toMatchSnapshot();
	});
});
