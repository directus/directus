import parseCSSVar from './parse-css-var';

describe('Utils / parseCSSVar', () => {
	it('Wraps CSS variables in var()', () => {
		const result = parseCSSVar('--red');

		expect(result).toBe('var(--red)');
	});

	it('Passes through regular CSS', () => {
		const result = parseCSSVar('#abcabc');

		expect(result).toBe('#abcabc');
	});
});
