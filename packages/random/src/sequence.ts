export const randomSequence = (length: number, characters: string) => {
	let result = '';

	for (let i = length; i > 0; i--) {
		result += characters[Math.floor(Math.random() * characters.length)];
	}

	return result;
};
