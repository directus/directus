import { isAllowed } from '../../src/utils/is-allowed';

jest.mock('../../src/stores', () => {
	return {
		usePermissionsStore: jest
			.fn()
			.mockReturnValueOnce({ permissions: [{}] }) // 1
			.mockReturnValueOnce({ permissions: [{}] }) // 2
			.mockReturnValueOnce({ permissions: [{ collection: 'test', action: 'update' }] }) //3
			.mockReturnValueOnce({
				permissions: [
					{
						collection: 'test',
						action: 'share',
						permissions: { testField: { _eq: 'field' } },
						fields: ['testField'],
					},
				],
			}) // 4
			.mockReturnValueOnce({
				permissions: [
					{
						collection: 'test',
						action: 'share',
						permissions: { testField: { _eq: 'field' } },
						fields: ['field'],
					},
				],
			}) //5
			.mockReturnValueOnce({
				permissions: [
					{
						collection: 'test',
						action: 'update',
						permissions: { testField: { _eq: 'field' } },
						fields: ['field'],
					},
				],
			}), //6

		useUserStore: jest.fn().mockReturnValueOnce({ isAdmin: true }).mockReturnValue({ isAdmin: false }),
	};
});

describe('isAllowed', () => {
	it('returns true if user is admin', () => {
		expect(isAllowed('test', 'update', {})).toBe(true);
	}); // 1

	it('returns false if there are no matching permissions', () => {
		expect(isAllowed('test', 'update', {})).toBe(false);
	}); // 2

	it('returns false if there is a matching permission but the action is not "share"', () => {
		expect(isAllowed('test', 'update', { testField: 'field' })).toBe(false);
	}); // 3

	it('returns true if there is a matching permission and matching fields', () => {
		expect(isAllowed('test', 'share', { testField: 'field' }, true)).toBe(true);
	}); // 4

	it('returns false if there is a matching permission and unmatching fields', () => {
		expect(isAllowed('test', 'share', { testField: 'no-match' }, true)).toBe(false);
	}); // 5

	it('returns false if action is not share and there is no matching fields', () => {
		expect(isAllowed('test', 'update', { no: 'no-match' }, true)).toBe(false);
	}); // 6
});
