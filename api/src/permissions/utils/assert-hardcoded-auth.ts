import { ForbiddenError } from '@directus/errors';
import type { HARDCODED_AUTH_REQUIREMENTS } from '@directus/system-data';
import type { Accountability } from '@directus/types';
import { isAdmin } from '../../utils/is-admin.js';

type Requirement = (typeof HARDCODED_AUTH_REQUIREMENTS)[number];

type ToPair<R> = R extends { collection: infer Collection; action: infer Action }
	? [collection: Collection, action: Action]
	: never;

/**
 * `[collection, action]` literal tuples for every `HARDCODED_AUTH_REQUIREMENTS` row of the given
 * tier. Used as the trailing parameters of the `assertHardcoded*` helpers so a mistyped or
 * wrong-tier pair is a compile error.
 */
export type HardcodedAuthPair<Tier extends Requirement['requiredAuth']> = ToPair<
	Extract<Requirement, { requiredAuth: Tier }>
>;

/**
 * Enforce the `admin`-tier `HARDCODED_AUTH_REQUIREMENTS` entry for a `(collection, action)` pair.
 * `null` (internal call) passes.
 *
 * `collection` / `action` are checked against the table at compile time - a mistyped or non-admin
 * pair is a type error - and carry no runtime effect. Keep call sites single-line with string
 * literals; the coverage test in `assert-hardcoded-auth.test.ts` scans for them.
 */
export function assertHardcodedAdmin(
	accountability: Accountability | null,
	..._pair: HardcodedAuthPair<'admin'>
): void {
	if (!isAdmin(accountability)) throw new ForbiddenError();
}

/**
 * Enforce the `user`-tier `HARDCODED_AUTH_REQUIREMENTS` entry for a `(collection, action)` pair: an
 * authenticated end user is required, so `null` (internal call) does not pass.
 *
 * `collection` / `action` are checked against the table at compile time and carry no runtime effect.
 * Keep call sites single-line with string literals; the coverage test in
 * `assert-hardcoded-auth.test.ts` scans for them.
 */
export function assertHardcodedUser(
	accountability: Accountability | null,
	..._pair: HardcodedAuthPair<'user'>
): asserts accountability is Accountability & { user: string } {
	if (!accountability?.user) throw new ForbiddenError();
}
