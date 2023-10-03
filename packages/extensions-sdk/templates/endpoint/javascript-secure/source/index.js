export default () => {
	exec('register-endpoint', {
		endpoint: '/',
		method: 'GET',
		handler: async () => {
			return {
				status: 200,
				body: 'Hello, World!',
			};
		}
	})
};
