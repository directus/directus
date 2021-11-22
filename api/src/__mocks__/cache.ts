export const cache = {
	get: jest.fn().mockResolvedValue(undefined),
	set: jest.fn().mockResolvedValue(true),
};

export const getCache = jest.fn().mockReturnValue({ cache });
