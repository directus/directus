import { isEmpty, notEmpty } from './is-empty';

describe('Util / isEmpty', () => {
	describe('isEmpty', () => {
		it('Returns true if value is null or undefined', () => {
			expect(isEmpty(null)).toBe(true);
			expect(isEmpty(undefined)).toBe(true);
		});

		it('Returns false if value is not null or undefined', () => {
			expect(isEmpty('test')).toBe(false);
			expect(isEmpty(123)).toBe(false);
		});
	});

	describe('notEmpty', () => {
		it('Returns true if value is null or undefined', () => {
			expect(notEmpty(null)).toBe(false);
			expect(notEmpty(undefined)).toBe(false);
		});

		it('Returns true if value is not null or undefined', () => {
			expect(notEmpty('test')).toBe(true);
			expect(notEmpty(123)).toBe(true);
		});
	});
});
