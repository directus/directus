import capitalizeFirst from './capitalize-first';

describe('Utils / capitalizeFirst', () => {
	it('Capitalizes the first letter', () => {
		const testCases = [
			['test', 'Test'],
			['directus', 'Directus'],
			['123', '123'],
			['_abc', '_abc'],
		];

		for (const testCase of testCases) {
			expect(capitalizeFirst(testCase[0])).toBe(testCase[1]);
		}
	});
});
