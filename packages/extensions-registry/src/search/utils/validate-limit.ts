import { inRange } from 'lodash-es';

export const validateLimit = (limit: number) => {
	if (inRange(limit, 1, 250) === false) {
		throw new TypeError('"limit" must be in range 1...250');
	}
};
