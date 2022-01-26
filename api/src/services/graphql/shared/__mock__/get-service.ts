export const mockGetService = jest.fn();

const mock = jest.fn().mockImplementation(() => {
	return {
		getService: mockGetService,
	};
});

export default mock;
