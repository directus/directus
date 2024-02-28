/**
 * This pattern is based on the patterns found in the 'uuid' and 'uuid-validate' npm
 * packages, both of which are MIT licensed.
 *
 * The primary difference between our pattern and the patterns found in the referenced packaeges is that
 * we do not perform any validation over the version component (the 14th character) of the UUID, while the
 * packages fail if the version is not a known one (versions 1 through 5 are accepted).
 *
 * @see https://datatracker.ietf.org/doc/html/rfc4122
 * @see https://github.com/uuidjs/uuid/blob/main/src/regex.js
 * @see https://github.com/microsoft/uuid-validate/blob/master/index.js
 * @see https://github.com/directus/directus/issues/21573
 */
// e22f209d-9e85-4ef5-b1fe-7dc09d2b67cf
//               ^ version
const REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUuid(uuid: string): boolean {
	return REGEX.test(uuid);
}
