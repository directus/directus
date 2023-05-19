/**
 * Return string of given length comprised of characters of given character set
 *
 * @param length - Length of the string to generate
 * @param characters - Character set to use
 */
export const randomSequence = (length: number, characters: string) => {
	let result = '';

	for (let i = length; i > 0; i--) {
		result += characters[Math.floor(Math.random() * characters.length)];
	}

	return result;
};
