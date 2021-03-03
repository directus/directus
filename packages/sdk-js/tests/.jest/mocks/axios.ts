jest.mock('axios');

import axios, { AxiosInstance } from 'axios';
(axios.create as jest.Mock<AxiosInstance>).mockImplementation((options) => {
	const instance = jest.requireActual('axios').create({
		...options,
		adapter: async (config) => {
			return {
				status: 404,
			};
		},
	});

	return instance;
});
