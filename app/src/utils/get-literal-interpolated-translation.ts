/**
 * Literal interpolation to use special characters such as "{", "}", "@", "$", and "|" in app translations
 *
 * @param translation - vue i18n translation string
 * @param keepCurlyBrackets - whether to skip interpolation for curly brackets. Defaults to false.
 * @returns - literal interpolated translation string
 *
 * @see {@link https://github.com/directus/directus/pull/11287}
 */
export function getLiteralInterpolatedTranslation(translation: string, keepCurlyBrackets = false) {
	const interpolatedCharacters = keepCurlyBrackets ? '@$|' : '{}@$|';
	return translation.replace(new RegExp(`([${interpolatedCharacters}])`, 'g'), "{'$1'}");
}
