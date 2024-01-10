/**
 * Throw a TypeError if the search text contains an npm special search qualifier
 */
export const validateSearchText = (text: string) => {
	const qualifiers = ['author', 'maintainer', 'keywords', 'not', 'is', 'boost-exact'];

	const containsQualifier = qualifiers.some((qualifier) => text.includes(` ${qualifier}:`));

	if (containsQualifier) {
		throw new TypeError('Search text cannot contain npm special search qualifiers');
	}
};
