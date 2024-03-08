type UUID = `${string}-${string}-${string}-${string}-${string}`;

/**
 * Based on the patterns found in the 'uuid' and 'uuid-validate' npm packages, both of which are MIT licensed.
 *
 * The primary difference between this pattern and the patterns found in the referenced packages is that
 * no validation over the version component (the 14th character) is performed, while the
 * packages fail if the version is not a known one (only versions 1 through 5 are accepted).
 *
 * This specification complies with all major database vendors.
 *
 * e22f209d-9e85-4ef5-b1fe-7dc09d2b67cf
 *               ^ version
 *
 * @see https://datatracker.ietf.org/doc/html/rfc4122
 * @see https://github.com/uuidjs/uuid/blob/bc46e198ab06311a9d82d3c9c6222062dd27f760/src/regex.js
 * @see https://github.com/microsoft/uuid-validate/blob/06554db1b093aa6bb429156fa8964e1cde2b750c/index.js
 * @see https://github.com/directus/directus/issues/21573
 */
const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): value is UUID {
	return regex.test(value);
}
