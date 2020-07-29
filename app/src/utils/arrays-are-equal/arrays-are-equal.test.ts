import arraysAreEqual from './arrays-are-equal';

describe('Util / arraysAreEqual', () => {
	it('Returns true for equal arrays', () => {
		const a1 = ['a', 'b', 'c'];
		const a2 = ['a', 'b', 'c'];
		const result = arraysAreEqual(a1, a2);
		expect(result).toBe(true);
	});

	it('Returns true for equal arrays in different orders', () => {
		const a1 = ['a', 'b', 'c'];
		const a2 = ['c', 'a', 'b'];
		const result = arraysAreEqual(a1, a2);
		expect(result).toBe(true);
	});

	it('Returns false for inequal arrays in different orders', () => {
		const a1 = ['a', 'b', 'c'];
		const a2 = [1, 2, 3];
		const result = arraysAreEqual(a1, a2);
		expect(result).toBe(false);
	});

	it('Returns false for equal arrays in inequal types', () => {
		const a1 = ['1', '2', '3'];
		const a2 = [1, 2, 3];
		const result = arraysAreEqual(a1, a2);
		expect(result).toBe(false);
	});

	it('Returns false for arrays of different lenghts', () => {
		const a1 = ['a', 'b', 'c', 'd'];
		const a2 = ['a', 'b', 'c'];
		const result = arraysAreEqual(a1, a2);
		expect(result).toBe(false);
	});
});
