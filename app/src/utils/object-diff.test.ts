import { objDiff } from './object-diff';

describe('', () => {
	it('returns an empty object if there is no differences', () => {
		const obj1 = { a: 1 };
		const obj2 = { a: 1 };

		expect(objDiff(obj1, obj2)).toStrictEqual({});
	});

	it('returns differences from both objects', () => {
		const obj1 = { a: 1 };
		const obj2 = { b: 1 };

		expect(objDiff(obj1, obj2)).toStrictEqual({ b: 1 });
	});

	it('returns an object of differences when obj2 has more keys', () => {
		const obj1 = {};
		const obj2 = { b: 1 };

		expect(objDiff(obj1, obj2)).toStrictEqual({ b: 1 });
	});

	// needed when a filter is added to a panel
	it('returns an object of differences when obj2 is deeper', () => {
		const obj1 = { a: { deep: 1 } };
		const obj2 = { a: { deeper: { deep: 1 } } };

		expect(objDiff(obj1, obj2)).toStrictEqual({ a: { deeper: { deep: 1 } } });
	});

	it('returns an object of differences with a deep inequality', () => {
		const obj1 = { a: { deeper: { deep: 1 } } };
		const obj2 = { a: { deeper: { deep: 2 } } };

		expect(objDiff(obj1, obj2)).toStrictEqual({ a: { deeper: { deep: 2 } } });
	});

	it('returns an object of differences when different keys', () => {
		const obj1 = { a: { deeper: { deep: 1 } } };
		const obj2 = { b: { deeper: { deep: 2 } } };

		expect(objDiff(obj1, obj2)).toStrictEqual({ b: { deeper: { deep: 2 } } });
	});

	it('returns an object just the additional keys (b)', () => {
		const obj1 = { a: { deeper: { deep: 1 } } };
		const obj2 = { a: { deeper: { deep: 1 } }, b: { deeper: { deep: 2 } } };

		expect(objDiff(obj1, obj2)).toStrictEqual({ b: { deeper: { deep: 2 } } });
	});
});
