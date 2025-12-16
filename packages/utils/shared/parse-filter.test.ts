import type { Filter, Policy, User } from '@directus/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseFilter } from './parse-filter.js';

describe('#parseFilter', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(1632431505992));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should accept empty filter object', () => {
		const filter = {};

		const parsedFilter = parseFilter(filter, null);

		expect(parsedFilter).toEqual({});
	});

	it('should accept empty object for key', () => {
		const filter = { field_a: {} };

		const parsedFilter = parseFilter(filter, null);

		expect(parsedFilter).toEqual({ field_a: {} });
	});

	it('returns the filter when passed accountability with only a role', () => {
		const mockFilter = { _and: [{ field: { _eq: 'field' } }] } as Filter;
		const mockAccountability = { role: 'admin' };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockFilter);
	});

	it('properly shifts up implicit logical operator', () => {
		const mockFilter = {
			date_field: {
				_and: [
					{
						_gte: '2023-10-01T00:00:00',
					},
					{
						_lt: '2023-11-01T00:00:00',
					},
				],
			},
		} as Filter;

		const mockResult = {
			_and: [
				{
					date_field: {
						_gte: '2023-10-01T00:00:00',
					},
				},
				{
					date_field: {
						_lt: '2023-11-01T00:00:00',
					},
				},
			],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('properly shifts up implicit logical operator twice', () => {
		const mockFilter = {
			article_field: {
				date_field: {
					_and: [
						{
							_gte: '2023-10-01T00:00:00',
						},
						{
							_lt: '2023-11-01T00:00:00',
						},
					],
				},
			},
		} as Filter;

		const mockResult = {
			_and: [
				{
					article_field: {
						date_field: {
							_gte: '2023-10-01T00:00:00',
						},
					},
				},
				{
					article_field: {
						date_field: {
							_lt: '2023-11-01T00:00:00',
						},
					},
				},
			],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('properly shifts up implicit logical operator three times', () => {
		const mockFilter = {
			i_really_dont_know: {
				article_field: {
					date_field: {
						_and: [
							{
								_gte: '2023-10-01T00:00:00',
							},
							{
								_lt: '2023-11-01T00:00:00',
							},
						],
					},
				},
			},
		} as Filter;

		const mockResult = {
			_and: [
				{
					i_really_dont_know: {
						article_field: {
							date_field: {
								_gte: '2023-10-01T00:00:00',
							},
						},
					},
				},
				{
					i_really_dont_know: {
						article_field: {
							date_field: {
								_lt: '2023-11-01T00:00:00',
							},
						},
					},
				},
			],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('properly shifts up nested implicit logical operators', () => {
		const mockFilter = {
			i_really_dont_know: {
				_or: [
					{
						article_field: {
							date_field: {
								_and: [
									{
										_gte: '2023-10-01T00:00:00',
									},
									{
										_lt: '2023-11-01T00:00:00',
									},
								],
							},
						},
					},
					{
						other_field: {
							date_field: {
								_and: [
									{
										_gte: '2023-10-01T00:00:00',
									},
									{
										_lt: '2023-11-01T00:00:00',
									},
								],
							},
						},
					},
				],
			},
		} as Filter;

		const mockResult = {
			_or: [
				{
					_and: [
						{
							i_really_dont_know: {
								article_field: { date_field: { _gte: '2023-10-01T00:00:00' } },
							},
						},
						{
							i_really_dont_know: {
								article_field: { date_field: { _lt: '2023-11-01T00:00:00' } },
							},
						},
					],
				},
				{
					_and: [
						{
							i_really_dont_know: {
								other_field: { date_field: { _gte: '2023-10-01T00:00:00' } },
							},
						},
						{
							i_really_dont_know: {
								other_field: { date_field: { _lt: '2023-11-01T00:00:00' } },
							},
						},
					],
				},
			],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('properly shifts up nested implicit logical operators', () => {
		const mockFilter = {
			i_really_dont_know: {
				some_field: {
					_or: [
						{
							article_field: {
								date_field: {
									_and: [
										{
											_gte: '2023-10-01T00:00:00',
										},
										{
											_lt: '2023-11-01T00:00:00',
										},
									],
								},
							},
						},
						{
							other_field: {
								date_field: {
									_and: [
										{
											_gte: '2023-10-01T00:00:00',
										},
										{
											_lt: '2023-11-01T00:00:00',
										},
									],
								},
							},
						},
					],
				},
			},
		} as Filter;

		const mockResult = {
			_or: [
				{
					_and: [
						{
							i_really_dont_know: {
								some_field: {
									article_field: { date_field: { _gte: '2023-10-01T00:00:00' } },
								},
							},
						},
						{
							i_really_dont_know: {
								some_field: {
									article_field: { date_field: { _lt: '2023-11-01T00:00:00' } },
								},
							},
						},
					],
				},
				{
					_and: [
						{
							i_really_dont_know: {
								some_field: {
									other_field: { date_field: { _gte: '2023-10-01T00:00:00' } },
								},
							},
						},
						{
							i_really_dont_know: {
								some_field: {
									other_field: { date_field: { _lt: '2023-11-01T00:00:00' } },
								},
							},
						},
					],
				},
			],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('properly shifts up nested implicit logical operators', () => {
		const mockFilter = {
			_and: [
				{
					_or: [
						{
							some_field: {
								_and: [
									{
										article_field: {
											date_field: {
												_gte: '2023-10-01T00:00:00',
											},
										},
									},
									{
										article_field: {
											date_field: {
												_lt: '2023-11-01T00:00:00',
											},
										},
									},
								],
							},
						},
					],
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					_or: [
						{
							_and: [
								{
									some_field: {
										article_field: { date_field: { _gte: '2023-10-01T00:00:00' } },
									},
								},
								{
									some_field: {
										article_field: { date_field: { _lt: '2023-11-01T00:00:00' } },
									},
								},
							],
						},
					],
				},
			],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('leaves explicit logical operator as is', () => {
		const mockFilter = {
			_and: [
				{
					date_field: {
						_gte: '2023-10-01T00:00:00',
					},
				},
				{
					date_field: {
						_lt: '2023-11-01T00:00:00',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					date_field: {
						_gte: '2023-10-01T00:00:00',
					},
				},
				{
					date_field: {
						_lt: '2023-11-01T00:00:00',
					},
				},
			],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('returns the filter includes an _in it parses the filter with a deepMap', () => {
		const mockFilter = {
			_and: [
				{
					status: {
						_in: 'published',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					status: {
						_in: ['published'],
					},
				},
			],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('returns the filter includes an _in it parses the filter with a deepMap', () => {
		const mockFilter = {
			_and: [
				{
					status: {
						_in: 'published,draft',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					status: {
						_in: ['published', 'draft'],
					},
				},
			],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('returns the date', () => {
		const mockFilter = {
			_and: [
				{
					date: {
						_eq: '$NOW',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					date: {
						_eq: new Date(),
					},
				},
			],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('returns the filter includes an _in it parses the filter with a deepMap', () => {
		const mockFilter = {
			_and: [
				{
					status: {
						_in: ['published', 'draft'],
					},
				},
			],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockFilter);
	});

	it('does proper type casting', () => {
		const mockFilter = {
			_and: [
				{
					status: {
						_eq: 'true',
					},
				},
				{
					field: {
						_eq: 'false',
					},
				},
				{
					field2: {
						_eq: 'null',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					status: {
						_eq: true,
					},
				},
				{
					field: {
						_eq: false,
					},
				},
				{
					field2: {
						_eq: null,
					},
				},
			],
		};

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('properly skips type casting', () => {
		const mockFilter = {
			_and: [
				{
					status: {
						_eq: 'true',
					},
				},
				{
					field: {
						_eq: 'false',
					},
				},
				{
					field2: {
						_eq: 'null',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					status: {
						_eq: 'true',
					},
				},
				{
					field: {
						_eq: 'false',
					},
				},
				{
					field2: {
						_eq: 'null',
					},
				},
			],
		};

		const mockAccountability = null;
		expect(parseFilter(mockFilter, mockAccountability, undefined, true)).toStrictEqual(mockResult);
	});

	it('replaces the user from accountability to $CURRENT_USER', () => {
		const mockFilter = {
			_and: [
				{
					owner: {
						_eq: '$CURRENT_USER',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					owner: {
						_eq: 'user',
					},
				},
			],
		} as Filter;

		const mockAccountability = { role: 'admin', user: 'user' };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
	});

	it('replaces the role from accountability to $CURRENT_ROLE', () => {
		const mockFilter = {
			_and: [
				{
					owner: {
						_eq: '$CURRENT_ROLE',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					owner: {
						_eq: 'admin',
					},
				},
			],
		} as Filter;

		const mockAccountability = { role: 'admin', roles: ['admin'] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
	});

	it('replaces the roles from accountability to $CURRENT_ROLES', () => {
		const mockFilter = {
			_and: [
				{
					owner: {
						_in: '$CURRENT_ROLES',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					owner: {
						_in: ['admin'],
					},
				},
			],
		} as Filter;

		const mockAccountability = { roles: ['admin'] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
	});

	it('adjusts the date by 1 day', () => {
		const mockFilter = {
			date: {
				_eq: '$NOW(-1 day)',
			},
		} as Filter;

		const mockResult = {
			date: {
				_eq: new Date('2021-09-22T21:11:45.992Z'),
			},
		} as Filter;

		const mockAccountability = { role: 'admin', user: 'user' };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
	});

	it('replaces field from user using the $CURRENT_USER variable', () => {
		const mockFilter = {
			_and: [
				{
					field: {
						_eq: '$CURRENT_USER.additional_field',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					field: {
						_eq: 'example-value',
					},
				},
			],
		} as Filter;

		const mockAccountability = { role: 'admin', user: 'user' };
		const mockContext = { $CURRENT_USER: { additional_field: 'example-value' } as unknown as User };
		expect(parseFilter(mockFilter, mockAccountability, mockContext)).toStrictEqual(mockResult);
	});

	it('replaces nested field from user using the $CURRENT_USER variable', () => {
		const mockFilter = {
			_and: [
				{
					field: {
						_eq: '$CURRENT_USER.additional_relation.field',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					field: {
						_eq: 'example-value',
					},
				},
			],
		} as Filter;

		const mockAccountability = { role: 'admin', user: 'user' };
		const mockContext = { $CURRENT_USER: { additional_relation: { field: 'example-value' } } as unknown as User };
		expect(parseFilter(mockFilter, mockAccountability, mockContext)).toStrictEqual(mockResult);
	});

	it('replaces nested field from user using the $CURRENT_USER variable', () => {
		const mockFilter = {
			_and: [
				{
					field: {
						_in: ['$CURRENT_USER.o2m.nested_o2m.field'],
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					field: {
						_in: ['example-value'],
					},
				},
			],
		} as Filter;

		const mockAccountability = { role: 'admin', user: 'user' };

		const mockContext = {
			$CURRENT_USER: { o2m: [{ nested_o2m: [{ field: 'example-value' }] }] } as unknown as User,
		};

		expect(parseFilter(mockFilter, mockAccountability, mockContext)).toStrictEqual(mockResult);
	});

	it('replaces the policies with the ids of the $CURRENT_POLICIES variable', () => {
		const mockFilter = {
			_and: [
				{
					owner: {
						_in: '$CURRENT_POLICIES',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					owner: {
						_in: ['policy-1'],
					},
				},
			],
		} as Filter;

		const mockAccountability = {};
		const mockContext = { $CURRENT_POLICIES: [{ id: 'policy-1' }] as unknown as Policy[] };
		expect(parseFilter(mockFilter, mockAccountability, mockContext)).toStrictEqual(mockResult);
	});

	it('replaces field from policies using the $CURRENT_POLICIES variable', () => {
		const mockFilter = {
			_and: [
				{
					owner: {
						_in: '$CURRENT_POLICIES.key',
					},
				},
			],
		} as Filter;

		const mockResult = {
			_and: [
				{
					owner: {
						_in: ['policy-key'],
					},
				},
			],
		} as Filter;

		const mockAccountability = {};
		const mockContext = { $CURRENT_POLICIES: [{ key: 'policy-key' }] as unknown as Policy[] };
		expect(parseFilter(mockFilter, mockAccountability, mockContext)).toStrictEqual(mockResult);
	});

	it('keeps _none filter flat with multiple fields (no _and wrapping)', () => {
		const mockFilter = {
			children: {
				_none: {
					status: {
						_eq: 'published',
					},
					logs: {
						event: {
							_eq: 'deleted',
						},
					},
				},
			},
		} as Filter;

		const mockResult = {
			children: {
				_none: {
					status: {
						_eq: 'published',
					},
					logs: {
						event: {
							_eq: 'deleted',
						},
					},
				},
			},
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('keeps _none filter flat with nested _or groups', () => {
		const mockFilter = {
			children: {
				_none: {
					status: {
						_eq: 'published',
					},
					logs: {
						_or: [{ event: { _eq: 'deleted' } }, { event: { _eq: 'archived' } }],
					},
				},
			},
		} as Filter;

		const mockResult = {
			children: {
				_none: {
					status: {
						_eq: 'published',
					},
					logs: {
						_or: [{ event: { _eq: 'deleted' } }, { event: { _eq: 'archived' } }],
					},
				},
			},
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('keeps _none filter flat with nested _and groups', () => {
		const mockFilter = {
			children: {
				_none: {
					status: {
						_eq: 'published',
					},
					logs: {
						_and: [{ event: { _eq: 'deleted' } }, { timestamp: { _gte: '2024-01-01' } }],
					},
				},
			},
		} as Filter;

		const mockResult = {
			children: {
				_none: {
					status: {
						_eq: 'published',
					},
					logs: {
						_and: [{ event: { _eq: 'deleted' } }, { timestamp: { _gte: '2024-01-01' } }],
					},
				},
			},
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('keeps _some filter flat with multiple fields (no _and wrapping)', () => {
		const mockFilter = {
			children: {
				_some: {
					status: {
						_eq: 'published',
					},
					logs: {
						event: {
							_eq: 'deleted',
						},
					},
				},
			},
		} as Filter;

		const mockResult = {
			children: {
				_some: {
					status: {
						_eq: 'published',
					},
					logs: {
						event: {
							_eq: 'deleted',
						},
					},
				},
			},
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('handles _or with simple filters', () => {
		const mockFilter = {
			_or: [{ skill: { _eq: 2 } }, { skill: { _eq: 3 } }],
		} as Filter;

		const mockResult = {
			_or: [{ skill: { _eq: 2 } }, { skill: { _eq: 3 } }],
		} as Filter;

		expect(parseFilter(mockFilter, null)).toStrictEqual(mockResult);
	});

	it('handles _or with nested _and groups', () => {
		const mockFilter = {
			_or: [{ skill: { _eq: 2 } }, { _and: [{ skill: { _eq: 3 } }] }],
		} as Filter;

		const result = parseFilter(mockFilter, null);

		const mockResult = {
			_or: [{ skill: { _eq: 2 } }, { _and: [{ skill: { _eq: 3 } }] }],
		} as Filter;

		expect(result).toStrictEqual(mockResult);
	});

	it('handles _or with nested _and groups when parsed as object (query params)', () => {
		// When query parser converts arrays to objects (e.g., when indices > 20)
		const mockFilter = {
			_or: {
				0: { skill: { _eq: 2 } },
				1: { _and: { 0: { skill: { _eq: 3 } } } },
			},
		} as any;

		const result = parseFilter(mockFilter, null);

		const mockResult = {
			_or: [{ skill: { _eq: 2 } }, { _and: [{ skill: { _eq: 3 } }] }],
		} as Filter;

		expect(result).toStrictEqual(mockResult);
	});

	it('handles nested operator structures from query params (e.g., field[_eq][_eq]=value)', () => {
		// When query params create nested operator structures like { level: { _eq: { _eq: '4' } } }
		const mockFilter = {
			_and: [
				{
					skills: {
						level: {
							_eq: {
								_eq: '4',
							},
						},
					},
				},
			],
		} as any;

		const result = parseFilter(mockFilter, null);

		const mockResult = {
			_and: [
				{
					skills: {
						level: {
							_eq: '4',
						},
					},
				},
			],
		} as Filter;

		expect(result).toStrictEqual(mockResult);
	});

	it('handles bracket-wrapped operator keys from qs parsing (e.g., "[_eq]" should become "_eq")', () => {
		// When qs parses nested array structures like filter[_and][0][_and][0][_or][1][_and][0][skills][level][_eq]=4
		// it can create bracket-wrapped keys like "[_eq]" instead of "_eq"
		const mockFilter = {
			_and: [
				{
					_and: [
						{
							_or: [
								{
									skills: {
										level: {
											_eq: '3',
										},
									},
								},
								{
									_and: [
										{
											skills: {
												level: {
													'[_eq]': '4', // qs can create this when parsing nested arrays
												},
											},
										},
									],
								},
							],
						},
					],
				},
				{
					status: {
						_neq: 'archived',
					},
				},
			],
		} as any;

		const result = parseFilter(mockFilter, null);

		const mockResult = {
			_and: [
				{
					_and: [
						{
							_or: [
								{
									skills: {
										level: {
											_eq: '3',
										},
									},
								},
								{
									_and: [
										{
											skills: {
												level: {
													_eq: '4',
												},
											},
										},
									],
								},
							],
						},
					],
				},
				{
					status: {
						_neq: 'archived',
					},
				},
			],
		} as Filter;

		expect(result).toStrictEqual(mockResult);
	});

	it('handles combined bracket-wrapped keys from qs parsing (e.g., "[level][_eq]" should become { level: { _eq: value } })', () => {
		// When qs parses deeply nested structures with _none filters, it can create combined bracket keys
		// like "[level][_eq]" instead of separate nested structure
		const mockFilter = {
			_and: [
				{
					_and: [
						{
							_or: [
								{
									_and: [
										{
											skills: {
												_none: {
													'[level][_eq]': '4', // qs can create this when parsing nested arrays
												},
											},
										},
									],
								},
							],
						},
					],
				},
			],
		} as any;

		const result = parseFilter(mockFilter, null);

		const mockResult = {
			_and: [
				{
					_and: [
						{
							_or: [
								{
									_and: [
										{
											skills: {
												_none: {
													level: {
														_eq: '4',
													},
												},
											},
										},
									],
								},
							],
						},
					],
				},
			],
		} as Filter;

		expect(result).toStrictEqual(mockResult);
	});
});
