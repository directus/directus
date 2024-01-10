export const validateSearchLimit = (limit: number) => {
	if (limit <= 0 || limit >= 250) {
		throw new TypeError('"limit" must be in range 1...250');
	}
};
