import { describe, expect, test, vi } from 'vitest';
import { sanitizePayload } from './sanitize-payload';

import { SchemaBuilder } from '@directus/schema-builder';
import { EventContext } from '@directus/types';
import { RealtimeWebSocket } from '../types';

function getServices() {
	const ItemsService = vi.fn();
	ItemsService.prototype.readOne = vi.fn(() => {
		return;
	});

	return {
		ItemsService,
	};
}

function getErrorServices(errorsOn: [field: string, s?: unknown][]) {
	const errorOn = new Map();

	for (const [fieldName, value] of errorsOn) {
		errorOn.set(fieldName, value);
	}

	const ItemsService = vi.fn();
	ItemsService.prototype.readOne = vi.fn((pk, { fields }: { fields: string[] }) => {
		const field = fields.find((f) => errorOn.has(f));

		if (!field) {
			return;
		}

		const fieldValue = errorOn.get(field);

		if (fieldValue === undefined || fieldValue == pk) {
			throw Error();
		}

		return;
	});

	return {
		ItemsService,
	};
}

const socket = { id: 'tester' } as RealtimeWebSocket;

const database = vi.fn() as unknown as EventContext['database'];

const schema = new SchemaBuilder()
	.collection('parents', (c) => {
		c.field('id').id();
		c.field('input').text();
		c.field('toggle').boolean();
		c.field('csv').csv();
		c.field('date').dateTime();
		c.field('hash').hash();
		c.field('json').json();
		c.field('m2o_child').m2o('child');
		c.field('o2m_child').o2m('child', 'parent_id');
		c.field('builder_child').m2a(['child']);
	})
	.collection('child', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('slug').string();
	})
	.build();

describe('Data Types', () => {
	test('Text', async () => {
		const payload = {
			input: 'The title',
		};

		const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
			database,
			schema,
			services: getServices(),
		});

		expect(sanitizedPayload).toStrictEqual(payload);
	});
	test('Boolean', async () => {
		const payload = {
			toggle: false,
		};

		const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
			database,
			schema,
			services: getServices(),
		});

		expect(sanitizedPayload).toStrictEqual(payload);
	});

	test('CSV', async () => {
		const payload = {
			csv: '1,2,3',
		};

		const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
			database,
			schema,
			services: getServices(),
		});

		expect(sanitizedPayload).toStrictEqual(payload);
	});

	test('Date', async () => {
		const payload = {
			date: new Date(),
		};

		const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
			database,
			schema,
			services: getServices(),
		});

		expect(sanitizedPayload).toStrictEqual(payload);
	});

	test('Hash is not emitted', async () => {
		const payload = {
			hash: '1234',
		};

		const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
			database,
			schema,
			services: getServices(),
		});

		expect(sanitizedPayload).toStrictEqual(null);
	});

	describe('JSON', async () => {
		test('Object', async () => {
			const payload = {
				json: {
					title: 'Halo',
				},
			};

			const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(payload);
		});

		test('Array', async () => {
			const payload = {
				json: [1, 2, 3],
			};

			const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(payload);
		});
	});
});

describe('Relations', () => {
	describe('Create New returns no change', () => {
		test('M2O', async () => {
			const payload = {
				m2o_child: { title: 'The title', slug: 'The slug' },
			};

			const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toBe(null);
		});

		test('O2M', async () => {
			const payload = {
				o2m_child: {
					create: [{ title: 'The title', slug: 'The slug' }],
					update: [],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(null);
		});

		test('M2A', async () => {
			const payload = {
				builder_child: {
					create: [
						{
							collection: 'child',
							item: { title: 'The title', slug: 'The slug' },
						},
					],
					update: [],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(null);
		});
	});

	describe('Add Existing', () => {
		describe('Full permissions expects regular payload', () => {
			test('M2O', async () => {
				const payload = {
					m2o_child: 1,
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getServices(),
				});

				expect(sanitizedPayload).toStrictEqual(payload);
			});

			test('O2M', async () => {
				const payload = {
					o2m_child: {
						create: [],
						update: [{ parent_id: '1', id: 1 }],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getServices(),
				});

				expect(sanitizedPayload).toStrictEqual(payload);
			});

			test('M2A', async () => {
				const payload = {
					builder_child: {
						create: [{ parents_id: '2', collection: 'child', item: { id: 3 } }],
						update: [],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getServices(),
				});

				expect(sanitizedPayload).toStrictEqual(payload);
			});
		});

		describe('Excludes fields without permission', async () => {
			test('M2O', async () => {
				const payload = {
					m2o_child: 2,
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['m2o_child']]),
				});

				expect(sanitizedPayload).toStrictEqual(null);
			});

			test('O2M', async () => {
				const payload = {
					o2m_child: {
						create: [],
						update: [{ parent_id: '1', id: 2 }],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['id', 2]]),
				});

				expect(sanitizedPayload).toStrictEqual({
					o2m_child: {
						create: [],
						update: [{ parent_id: '1' }],
						delete: [],
					},
				});
			});

			test('M2A', async () => {
				const payload = {
					builder_child: {
						create: [{ parents_id: '2', collection: 'child', item: { id: 999 } }],
						update: [],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['id', 999]]),
				});

				expect(sanitizedPayload).toStrictEqual({
					builder_child: {
						create: [{ collection: 'child', parents_id: '2', item: {} }],
						update: [],
						delete: [],
					},
				});
			});
		});

		describe('Excludes records without permission', () => {
			test('M2O', async () => {
				const payload = {
					m2o_child: 2,
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['id', 2]]),
				});

				expect(sanitizedPayload).toStrictEqual(null);
			});

			test('O2M', async () => {
				const payload = {
					o2m_child: {
						create: [],
						update: [{ id: 2 }],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['id', 2]]),
				});

				expect(sanitizedPayload).toStrictEqual(null);
			});

			test('M2A', async () => {
				const payload = {
					builder_child: {
						create: [{ parents_id: '2', collection: 'child', item: { id: 999 } }],
						update: [],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['id']]),
				});

				expect(sanitizedPayload).toStrictEqual({
					builder_child: {
						create: [
							{
								collection: 'child',
								item: {},
							},
						],
						delete: [],
						update: [],
					},
				});
			});
		});
	});

	describe('Update', () => {
		describe('Full permissions expects regular payload', () => {
			test('M2O', async () => {
				const payload = {
					m2o_child: {
						title: 'The title change 1',
						slug: 'The slug change 1',
						id: 1,
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getServices(),
				});

				expect(sanitizedPayload).toStrictEqual(payload);
			});

			test('O2M', async () => {
				const payload = {
					o2m_child: {
						create: [],
						update: [{ title: 'The title change 1', slug: 'The slug change 1', id: 1 }],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getServices(),
				});

				expect(sanitizedPayload).toStrictEqual(payload);
			});

			test('M2A', async () => {
				const payload = {
					builder_child: {
						create: [],
						update: [
							{
								collection: 'child',
								item: {
									title: 'The title change 1',
									slug: 'The slug change 1',
									id: 1,
								},
								id: 1,
							},
						],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getServices(),
				});

				expect(sanitizedPayload).toStrictEqual(payload);
			});
		});

		describe('Excludes fields without permission', () => {
			test('M2O', async () => {
				const payload = {
					m2o_child: {
						title: 'The title change 1',
						slug: 'The slug change 1',
						id: 1,
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['slug']]),
				});

				expect(sanitizedPayload).toStrictEqual({
					m2o_child: {
						title: 'The title change 1',
						id: 1,
					},
				});
			});

			test('O2M', async () => {
				const payload = {
					o2m_child: {
						create: [],
						update: [{ title: 'The title change 1', slug: 'The slug change 1', id: 1 }],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['slug']]),
				});

				expect(sanitizedPayload).toStrictEqual({
					o2m_child: {
						create: [],
						update: [{ title: 'The title change 1', id: 1 }],
						delete: [],
					},
				});
			});

			test('M2A', async () => {
				const payload = {
					builder_child: {
						create: [],
						update: [
							{
								collection: 'child',
								item: {
									title: 'The title change 1',
									slug: 'The slug change 1',
									id: 2,
								},
								id: 1,
							},
						],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['slug']]),
				});

				expect(sanitizedPayload).toStrictEqual({
					builder_child: {
						create: [],
						update: [
							{
								collection: 'child',
								item: {
									title: 'The title change 1',
									id: 2,
								},
								id: 1,
							},
						],
						delete: [],
					},
				});
			});
		});

		describe('Excludes record without permission', () => {
			test('M2O', async () => {
				const payload = {
					m2o_child: {
						title: 'The title change 1',
						slug: 'The slug change 1',
						id: 1,
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['title'], ['slug'], ['id']]),
				});

				expect(sanitizedPayload).toStrictEqual(null);
			});

			test('O2M', async () => {
				const payload = {
					o2m_child: {
						create: [],
						update: [{ title: 'The title change 1', slug: 'The slug change 1', id: 1 }],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['title'], ['slug'], ['id']]),
				});

				expect(sanitizedPayload).toStrictEqual(null);
			});

			test('M2A', async () => {
				const payload = {
					builder_child: {
						create: [],
						update: [
							{
								collection: 'child',
								item: {
									title: 'The title change 1',
									slug: 'The slug change 1',
									id: 1,
								},
								id: 1,
							},
						],
						delete: [],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['item'], ['id'], ['collection']]),
				});

				expect(sanitizedPayload).toStrictEqual(null);
			});
		});
	});

	describe('Delete', () => {
		describe('Full permissions expects regular payload', () => {
			test('M2O', async () => {
				const payload = {
					m2o_child: null,
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getServices(),
				});

				expect(sanitizedPayload).toStrictEqual(payload);
			});

			test('O2M', async () => {
				const payload = {
					o2m_child: {
						create: [],
						update: [],
						delete: [8],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getServices(),
				});

				expect(sanitizedPayload).toStrictEqual(payload);
			});

			test('M2A', async () => {
				const payload = {
					builder_child: { create: [], update: [], delete: [2] },
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getServices(),
				});

				expect(sanitizedPayload).toStrictEqual(payload);
			});
		});

		describe('Excludes ids that are not allowed', () => {
			test('O2M', async () => {
				const payload = {
					o2m_child: {
						create: [],
						update: [],
						delete: [8, 9, 10],
					},
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['id', 9]]),
				});

				expect(sanitizedPayload).toStrictEqual({
					o2m_child: {
						create: [],
						update: [],
						delete: [8, 10],
					},
				});
			});

			test('M2A', async () => {
				const payload = {
					builder_child: { create: [], update: [], delete: [9] },
				};

				const sanitizedPayload = await sanitizePayload(socket.accountability, 'parents:1', payload, {
					database,
					schema,
					services: getErrorServices([['id', 9]]),
				});

				expect(sanitizedPayload).toStrictEqual(null);
			});
		});
	});
});
