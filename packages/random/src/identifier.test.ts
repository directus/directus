import { expect, test, vi } from 'vitest';
import { randomAlpha } from './alpha.js';
import { randomIdentifier } from './identifier.js';
import { randomInteger } from './integer.js';

vi.mock('./alpha.js');
vi.mock('./integer.js');

test('Uses randomAlpha / randomInteger to generate a string', () => {
	vi.mocked(randomInteger).mockReturnValue(5);

	randomIdentifier();

	expect(randomInteger).toHaveBeenCalledWith(3, 25);
	expect(randomAlpha).toHaveBeenCalledWith(5);
});
