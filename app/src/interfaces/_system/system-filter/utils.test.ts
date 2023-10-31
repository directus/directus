import { expect, test, describe } from 'vitest';
import { fieldToFilter, getComparator, getField, getKeyPath, getNodeName, getValue, isSome } from './utils';


describe('fieldToFilter', () => {
	test('with some set to true', () => {
		const filter = fieldToFilter('a.b.c', '_eq', 'myValue', true);

		expect(filter).toEqual({
			'a': {
				'b': {
					'c': {
						'_eq': 'myValue',
					},
				},
			},
		});
	});

	test('with some set to false', () => {
		const filter = fieldToFilter('a.b.c', '_eq', 'myValue', false);

		expect(filter).toEqual({
			'a': {
				'_none': {
					'b': {
						'c': {
							'_eq': 'myValue',
						},
					},
				}
			},
		});
	});
});

describe('getComparator', () => {
	test('on nested fields', () => {
		const filter = {
			"some_field": {
				"nested": {
					"_eq": "someValue"
				}
			}
		}

		expect(getComparator(filter)).toEqual('_eq');
	});

	test('on _none', () => {
		const filter = {
			"some_field": {
				"_none": {
					"nested": {
						"_neq": "someValue"
					}
				}
			}
		}

		expect(getComparator(filter)).toEqual('_neq');
	});
});

describe('getNodeName', () => {
	test('on basic object', () => {
		const filter = {
			"some_field": {
				"nested": {
					"_eq": "someValue"
				}
			}
		}

		expect(getNodeName(filter)).toEqual('some_field');
	});

	test('on empty object', () => {
		const filter = {}

		expect(getNodeName(filter)).toBeUndefined();
	});
})

describe('getField', () => {
	test('on nested fields', () => {
		const filter = {
			"some_field": {
				"nested": {
					"_eq": "someValue"
				}
			}
		}

		expect(getField(filter)).toEqual('some_field.nested');
	});

	test('on _none', () => {
		const filter = {
			"some_field": {
				"_none": {
					"nested": {
						"_neq": "someValue"
					}
				}
			}
		}

		expect(getField(filter)).toEqual('some_field.nested');
	});
})

describe('getKeyPath', () => {
	test('on nested fields', () => {
		const filter = {
			"some_field": {
				"nested": {
					"_eq": "someValue"
				}
			}
		}

		expect(getKeyPath(filter)).toEqual('some_field.nested');
	});

	test('on _none', () => {
		const filter = {
			"some_field": {
				"_none": {
					"nested": {
						"_neq": "someValue"
					}
				}
			}
		}

		expect(getKeyPath(filter)).toEqual('some_field._none.nested');
	});
})

describe('isSome', () => {
	test('on default filter', () => {
		const filter = {
			"some_field": {
				"nested": {
					"_eq": "someValue"
				}
			}
		}

		expect(isSome(filter)).toBeTruthy()
	});

	test('on _some', () => {
		const filter = {
			"some_field": {
				"_some": {
					"nested": {
						"_neq": "someValue"
					}
				}
			}
		}

		expect(isSome(filter)).toBeTruthy()
	});

	test('on _none', () => {
		const filter = {
			"some_field": {
				"_none": {
					"nested": {
						"_neq": "someValue"
					}
				}
			}
		}

		expect(isSome(filter)).toBeFalsy()
	});
})

describe('getValue', () => {
	test('on default filter', () => {
		const filter = {
			"some_field": {
				"nested": {
					"_eq": "someValue"
				}
			}
		}

		expect(getValue(filter)).toEqual('someValue')
	});

	test('on _none', () => {
		const filter = {
			"some_field": {
				"_none": {
					"nested": {
						"_neq": "someValue"
					}
				}
			}
		}

		expect(getValue(filter)).toEqual('someValue')
	});
})
