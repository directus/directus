import { describe, expect, test } from 'vitest';
import { getClientBetterSQLite3 } from './better-sqlite3.js';

describe('getClientBetterSQLite3', () => {
	/**
	 * A config without `connection` initialises neither a driver nor a pool, so this client holds no
	 * resources and needs no teardown.
	 */
	function createClient() {
		const ClientBetterSQLite3 = getClientBetterSQLite3();
		return new ClientBetterSQLite3({
			client: 'better-sqlite3',
			useNullAsDefault: true,
			compileSqlOnError: false,
		});
	}

	test('extends the better-sqlite3 dialect', () => {
		expect(createClient().driverName).toBe('better-sqlite3');
	});

	test('reports the class name that getDatabaseClient() and createInspector() dispatch on', () => {
		expect(getClientBetterSQLite3().name).toBe('DirectusBetterSQLite3');
	});

	describe('prepBindings', () => {
		test('hands integers to better-sqlite3 as BigInt, so text columns keep their exact form', () => {
			expect(createClient().prepBindings([41, 0, -7])).toEqual([41n, 0n, -7n]);
		});

		test('converts integers past the safe range too, so every id renders the same way', () => {
			// the double is already imprecise here, but it still has to render without a `.0` suffix
			expect(createClient().prepBindings([Number.MAX_SAFE_INTEGER + 2])).toEqual([9007199254740992n]);

			// the int64 bounds themselves: the largest double below 2^63, and -2^63 exactly
			expect(createClient().prepBindings([2 ** 63 - 1024, -(2 ** 63)])).toEqual([2n ** 63n - 1024n, -(2n ** 63n)]);
		});

		test('leaves integers better-sqlite3 would reject on the double path', () => {
			// past int64 the driver throws `RangeError: The bound string, buffer, or bigint is too big`
			expect(createClient().prepBindings([2 ** 63, -(2 ** 63) - 4096, 1e30])).toEqual([
				2 ** 63,
				-(2 ** 63) - 4096,
				1e30,
			]);
		});

		test('unwraps a Date, which knex would otherwise reduce to an epoch double downstream of here', () => {
			const when = new Date('2026-08-06T12:34:56.789Z');

			expect(createClient().prepBindings([when])).toEqual([1786019696789n]);
		});

		test('leaves an invalid Date to knex, whose _formatBindings reduces it to NaN', () => {
			const invalid = new Date('nope');

			expect(createClient().prepBindings([invalid])).toEqual([invalid]);
		});

		test('leaves every other binding untouched', () => {
			// a non-integral double already renders as the digits we want, and can't convert anyway
			expect(createClient().prepBindings([91.97, Infinity, NaN])).toEqual([91.97, Infinity, NaN]);

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
