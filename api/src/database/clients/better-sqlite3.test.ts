import { describe, expect, test } from 'vitest';
import { getClientBetterSQLite3 } from './better-sqlite3.js';

describe('getClientBetterSQLite3', () => {
	/**
	 * A config without `connection` initialises neither a driver nor a pool, so this client holds no
	 * resources and needs no teardown.
	 */
	function createClient() {
		const ClientBetterSQLite3 = getClientBetterSQLite3();
		return new ClientBetterSQLite3({ client: 'better-sqlite3', useNullAsDefault: true });
	}

	test('extends the better-sqlite3 dialect', () => {
		expect(createClient().driverName).toBe('better-sqlite3');
	});

	test('reports the class name that getDatabaseClient() and createInspector() dispatch on', () => {
		expect(getClientBetterSQLite3().name).toBe('DirectusBetterSQLite3');
	});

	test('returns the same class on every call', () => {
		expect(getClientBetterSQLite3()).toBe(getClientBetterSQLite3());
	});

	describe('prepBindings', () => {
		test('hands integers to better-sqlite3 as BigInt, so text columns keep their exact form', () => {
			expect(createClient().prepBindings([41, 0, -7])).toEqual([41n, 0n, -7n]);
		});

		test('leaves every other binding untouched', () => {
			// floats and unsafe integers can't round-trip through BigInt, so they keep the double path
			expect(createClient().prepBindings([91.97, Number.MAX_SAFE_INTEGER + 2])).toEqual([
				91.97,
				Number.MAX_SAFE_INTEGER + 2,
			]);

			expect(createClient().prepBindings(['41', null, true, 12n] as any)).toEqual(['41', null, true, 12n]);
		});

		test('passes through what knex hands it for queries without positional bindings', () => {
			// a query built from a bare SQL string has no bindings at all
			expect(createClient().prepBindings(undefined as any)).toBeUndefined();

			// and a dialect using named bindings gets an object
			expect(createClient().prepBindings({ 1: 41 } as any)).toEqual({ 1: 41 });
		});
	});
});
