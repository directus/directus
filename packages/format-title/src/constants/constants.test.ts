import { expect, test } from 'vitest';
import acronyms from '../constants/acronyms.js';
import specialCase from '../constants/special-case.js';

test('No duplicates across acronyms and special cases', () => {
	const constants = [...acronyms, ...specialCase];
	const duplicates = constants.filter((item, index) => constants.indexOf(item) !== index);

	expect(duplicates).toEqual([]);
});
