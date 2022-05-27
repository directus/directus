import { isAllowed } from '../../src/utils/is-allowed';

describe('isAllowed', () => {
	it(' ', () => {
		expect(isAllowed('test', 'update', {})).toBe('');
	});
});
