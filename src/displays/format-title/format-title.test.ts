import handler from './handler';
import formatTitle from '@directus/format-title';

jest.mock('@directus/format-title');

describe('Displays / Format Title', () => {
	it('Runs the value through the title formatter', () => {
		handler('test', null, { type: 'string' });
		expect(formatTitle).toHaveBeenCalledWith('test');
	});

	it('Does not pass the value if the value is falsy', () => {
		handler(null, null, { type: 'string' });
		expect(formatTitle).not.toHaveBeenCalledWith(null);
	});
});
