/**
 * Ensures the search text doesn't contain any npm special search qualifier
 * @throws TypeError if text contains npm special search qualifiers
 */
export const validateText = (text: string) => {
	const qualifiers = ['author', 'maintainer', 'keywords', 'not', 'is', 'boost-exact'];

	const containsQualifier = qualifiers.some(
		(qualifier) => text.startsWith(`${qualifier}:`) || text.includes(` ${qualifier}:`),
	);

	if (containsQualifier) {
		throw new TypeError('Search text cannot contain npm special search qualifiers');
	}
};
