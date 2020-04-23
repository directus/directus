import parseChoices from './parse-choices';

describe('Utils / Parse Choices', () => {
	it('Filters out empty rows', () => {
		const choices = `
test

above is gone
		`;

		const result = parseChoices(choices);

		expect(result.length).toBe(2);
		expect(result[0]).toEqual({ text: 'test', value: 'test' });
	});

	it('Filters out whitespace around options', () => {
		const choices = '              bunch of whitespace             ';

		const result = parseChoices(choices);

		expect(result.length).toBe(1);
		expect(result[0]).toEqual({ text: 'bunch of whitespace', value: 'bunch of whitespace' });
	});

	it('Separates on double colon to form key/value pairs', () => {
		const choices = `
			value::Text
		`;
		const result = parseChoices(choices);
		expect(result[0]).toEqual({ text: 'Text', value: 'value' });
	});

	it('Trims whitespace around colons', () => {
		const choices = `
			works     :: Yes!
		`;

		const result = parseChoices(choices);
		expect(result[0]).toEqual({ text: 'Yes!', value: 'works' });
	});
});
