export default () => {
	exec('register-endpoint', {
		endpoint: '/',
		method: 'GET',
		handler: () => {
			return {
				status: 200,
				body: 'Hello, World!',
			};
		}
	})
};
