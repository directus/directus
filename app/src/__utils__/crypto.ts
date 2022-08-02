import crypto from 'node:crypto';

export const cryptoStub = {
	value: {
		getRandomValues: (arr: any[]) => crypto.randomBytes(arr.length),
	},
};
