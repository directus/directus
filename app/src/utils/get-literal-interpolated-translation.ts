/**
 * Literal interpolation to use special characters such as "{", "}", "@", "$", and "|" in app translations
 *
 * @param translation - vue i18n translation string
 * @returns - literal interpolated translation string
 *
 * @see {@link https://github.com/directus/directus/pull/11287}
 */
export function getLiteralInterpolatedTranslation(translation: string) {
	return translation.replace(/([{}@$|])/g, "{'$1'}");
}
