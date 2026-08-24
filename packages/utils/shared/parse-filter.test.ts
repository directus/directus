import type { Filter, Policy, User } from '@directus/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseFilter, parsePreset } from './parse-filter.js';

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
		const mockAccountability = { role: 'admin', user: null, roles: [] };
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockFilter);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
		expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
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

		const mockAccountability = { role: 'admin', user: 'user', roles: [] };
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

		const mockAccountability = { role: 'admin', user: null, roles: [] };
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

		const mockAccountability = { role: null, roles: ['admin'], user: null };
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

		const mockAccountability = { role: 'admin', user: 'user', roles: [] };
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

		const mockAccountability = { role: 'admin', user: 'user', roles: [] };
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

		const mockAccountability = { role: 'admin', user: 'user', roles: [] };
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

		const mockAccountability = { role: 'admin', user: 'user', roles: [] };

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

		const mockAccountability = { role: null, user: null, roles: [] };
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

		const mockAccountability = { role: null, user: null, roles: [] };
		const mockContext = { $CURRENT_POLICIES: [{ key: 'policy-key' }] as unknown as Policy[] };
		expect(parseFilter(mockFilter, mockAccountability, mockContext)).toStrictEqual(mockResult);
	});

	describe('_json operator', () => {
		it('passes through a basic _json sub-filter unchanged', () => {
			const mockFilter = {
				metadata: {
					_json: {
						tags: { _eq: 'news' },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockFilter);
		});

		it('passes through nested _json path operators unchanged', () => {
			const mockFilter = {
				data: {
					_json: {
						'address.city': { _eq: 'London' },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockFilter);
		});

		it('coerces string booleans inside _json values when skipCoercion is false', () => {
			const mockFilter = {
				config: {
					_json: {
						enabled: { _eq: 'true' },
					},
				},
			} as Filter;

			const mockResult = {
				config: {
					_json: {
						enabled: { _eq: true },
					},
				},
			};

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
		});

		it('coerces "null" string inside _json values when skipCoercion is false', () => {
			const mockFilter = {
				config: {
					_json: {
						value: { _eq: 'null' },
					},
				},
			} as Filter;

			const mockResult = {
				config: {
					_json: {
						value: { _eq: null },
					},
				},
			};

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
		});

		it('skips coercion inside _json values when skipCoercion is true', () => {
			const mockFilter = {
				config: {
					_json: {
						enabled: { _eq: 'true' },
						active: { _eq: 'false' },
						value: { _eq: 'null' },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability, undefined, true)).toStrictEqual(mockFilter);
		});

		it('resolves $CURRENT_USER inside _json values', () => {
			const mockFilter = {
				data: {
					_json: {
						owner: { _eq: '$CURRENT_USER' },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: 'user-id', roles: [] };

			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual({
				data: {
					_json: {
						owner: { _eq: 'user-id' },
					},
				},
			});
		});

		it('resolves $NOW inside _json values', () => {
			const mockFilter = {
				data: {
					_json: {
						date: { _gte: '$NOW' },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: null, roles: [] };

			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual({
				data: {
					_json: {
						date: { _gte: expect.any(Date) },
					},
				},
			});
		});

		it('resolves $CURRENT_USER inside _json with nested path key', () => {
			const mockFilter = {
				metadata: {
					_json: {
						'user.id': { _eq: '$CURRENT_USER' },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: 'user-id', roles: [] };

			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual({
				metadata: {
					_json: {
						'user.id': { _eq: 'user-id' },
					},
				},
			});
		});

		it('resolves $CURRENT_USER inside _json _in operator', () => {
			const mockFilter = {
				data: {
					_json: {
						owner: { _in: ['$CURRENT_USER', 'other-id'] },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: 'user-id', roles: [] };

			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual({
				data: {
					_json: {
						owner: { _in: ['user-id', 'other-id'] },
					},
				},
			});
		});

		it('resolves $CURRENT_USER inside _json _or sub-filter', () => {
			const mockFilter = {
				data: {
					_json: {
						_or: [{ owner: { _eq: '$CURRENT_USER' } }, { role: { _eq: 'admin' } }],
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: 'user-id', roles: [] };

			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual({
				data: {
					_json: {
						_or: [{ owner: { _eq: 'user-id' } }, { role: { _eq: 'admin' } }],
					},
				},
			});
		});

		it('handles _json inside _and', () => {
			const mockFilter = {
				_and: [
					{
						field: { _eq: 'value' },
					},
					{
						metadata: {
							_json: {
								tags: { _contains: 'news' },
							},
						},
					},
				],
			} as Filter;

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockFilter);
		});

		it('handles _json inside _or', () => {
			const mockFilter = {
				_or: [
					{ title: { _eq: 'hello' } },
					{
						data: {
							_json: {
								type: { _eq: 'article' },
							},
						},
					},
				],
			} as Filter;

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockFilter);
		});

		it('resolves $CURRENT_USER inside _json _and sub-filter', () => {
			const mockFilter = {
				data: {
					_json: {
						_and: [{ owner: { _eq: '$CURRENT_USER' } }, { status: { _eq: 'active' } }],
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: 'user-id', roles: [] };

			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual({
				data: {
					_json: {
						_and: [{ owner: { _eq: 'user-id' } }, { status: { _eq: 'active' } }],
					},
				},
			});
		});

		it('resolves $CURRENT_ROLE inside _json values', () => {
			const mockFilter = {
				data: {
					_json: {
						role: { _eq: '$CURRENT_ROLE' },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin-role', user: 'user-id', roles: [] };

			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual({
				data: {
					_json: {
						role: { _eq: 'admin-role' },
					},
				},
			});
		});

		it('resolves $CURRENT_ROLES inside _json _in operator', () => {
			const mockFilter = {
				data: {
					_json: {
						roles: { _in: '$CURRENT_ROLES' },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: 'user-id', roles: ['role-1', 'role-2'] };

			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual({
				data: {
					_json: {
						roles: { _in: ['role-1', 'role-2'] },
					},
				},
			});
		});

		it('resolves $NOW with adjustment inside _json values', () => {
			const mockFilter = {
				data: {
					_json: {
						date: { _lt: '$NOW(-1 day)' },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: null, roles: [] };

			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual({
				data: {
					_json: {
						date: { _lt: new Date('2021-09-22T21:11:45.992Z') },
					},
				},
			});
		});

		it('handles _nin operator inside _json', () => {
			const mockFilter = {
				data: {
					_json: {
						status: { _nin: ['draft', 'archived'] },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockFilter);
		});

		it('handles _between operator inside _json', () => {
			const mockFilter = {
				data: {
					_json: {
						price: { _between: ['10', '100'] },
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockFilter);
		});

		it('handles qs-style object (indices > 20) for _in inside _json by converting to array', () => {
			const mockFilter = {
				data: {
					_json: {
						status: { _in: { 0: 'published', 1: 'draft' } },
					},
				},
			} as unknown as Filter;

			const mockAccountability = { role: 'admin', user: null, roles: [] };

			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual({
				data: {
					_json: {
						status: { _in: ['published', 'draft'] },
					},
				},
			});
		});

		it('handles deeply nested JSON path keys inside _json', () => {
			const mockFilter = {
				data: {
					_json: {
						address: {
							city: { _eq: '$CURRENT_USER' },
						},
					},
				},
			} as Filter;

			const mockAccountability = { role: 'admin', user: 'user-id', roles: [] };

			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual({
				data: {
					_json: {
						address: {
							city: { _eq: 'user-id' },
						},
					},
				},
			});
		});
	});

	describe('_none and _some bypass operators', () => {
		it('recursively processes sub-filter inside _some', () => {
			const mockFilter = {
				articles: {
					_some: {
						author: { _eq: '$CURRENT_USER' },
					},
				},
			} as Filter;

			const mockResult = {
				articles: {
					_some: {
						author: { _eq: 'user-id' },
					},
				},
			};

			const mockAccountability = { role: 'admin', user: 'user-id', roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
		});

		it('recursively processes sub-filter inside _none', () => {
			const mockFilter = {
				tags: {
					_none: {
						name: { _eq: '$CURRENT_USER' },
					},
				},
			} as Filter;

			const mockResult = {
				tags: {
					_none: {
						name: { _eq: 'user-id' },
					},
				},
			};

			const mockAccountability = { role: 'admin', user: 'user-id', roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
		});

		it('coerces string booleans inside _some sub-filters', () => {
			const mockFilter = {
				items: {
					_some: {
						active: { _eq: 'true' },
					},
				},
			} as Filter;

			const mockResult = {
				items: {
					_some: {
						active: { _eq: true },
					},
				},
			};

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
		});
	});

	describe('_between and _nbetween', () => {
		it('converts a comma-separated string to an array for _between', () => {
			const mockFilter = {
				price: { _between: '10,100' },
			} as Filter;

			const mockResult = {
				price: { _between: ['10', '100'] },
			};

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
		});

		it('handles qs-style object (indices > 20) for _between by converting to array', () => {
			const mockFilter = {
				price: { _between: { 0: '10', 1: '100' } },
			} as unknown as Filter;

			const mockResult = {
				price: { _between: ['10', '100'] },
			};

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
		});

		it('converts a comma-separated string to an array for _nbetween', () => {
			const mockFilter = {
				price: { _nbetween: '10,100' },
			} as Filter;

			const mockResult = {
				price: { _nbetween: ['10', '100'] },
			};

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
		});
	});

	describe('_intersects geometry operators', () => {
		it('parses a stringified GeoJSON value for _intersects', () => {
			const geoJson = { type: 'Point', coordinates: [0, 0] };

			const mockFilter = {
				location: { _intersects: JSON.stringify(geoJson) },
			} as unknown as Filter;

			const mockResult = {
				location: { _intersects: geoJson },
			};

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
		});

		it('passes through a GeoJSON object for _intersects_bbox without modification', () => {
			const geoJson = {
				type: 'Polygon',
				coordinates: [
					[
						[0, 0],
						[1, 0],
						[1, 1],
						[0, 1],
						[0, 0],
					],
				],
			};

			const mockFilter = {
				location: { _intersects_bbox: geoJson },
			} as unknown as Filter;

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockFilter);
		});
	});

	describe('null / edge cases', () => {
		it('returns null for a null filter', () => {
			expect(parseFilter(null, null)).toBeNull();
		});

		it('wraps multiple top-level keys in an implicit _and', () => {
			const mockFilter = {
				status: { _eq: 'published' },
				author: { _eq: 'user-id' },
			} as Filter;

			const mockResult = {
				_and: [{ status: { _eq: 'published' } }, { author: { _eq: 'user-id' } }],
			};

			const mockAccountability = { role: 'admin', user: null, roles: [] };
			expect(parseFilter(mockFilter, mockAccountability)).toStrictEqual(mockResult);
		});
	});

	describe('#parsePreset', () => {
		it('returns null/falsy preset as-is', () => {
			expect(parsePreset(null, null, {})).toBeNull();
		});

		it('coerces string booleans in preset values', () => {
			const preset = { active: 'true', deleted: 'false', value: 'null' };
			const result = parsePreset(preset, null, {});
			expect(result).toStrictEqual({ active: true, deleted: false, value: null });
		});

		it('resolves $CURRENT_USER in preset values', () => {
			const preset = { owner: '$CURRENT_USER' };
			const accountability = { role: 'admin', user: 'user-123', roles: [] };
			const result = parsePreset(preset, accountability, {});
			expect(result).toStrictEqual({ owner: 'user-123' });
		});

		it('resolves $CURRENT_ROLE in preset values', () => {
			const preset = { role: '$CURRENT_ROLE' };
			const accountability = { role: 'admin-role', user: null, roles: [] };
			const result = parsePreset(preset, accountability, {});
			expect(result).toStrictEqual({ role: 'admin-role' });
		});
	});
});
