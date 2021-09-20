import { test } from './testfunc';
describe('the test is found', () => {
	it('runs the test', () => {
		expect(test()).toBe(2);
	});
});
