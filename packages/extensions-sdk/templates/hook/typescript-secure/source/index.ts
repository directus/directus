export default () => {
	exec('register-filter', {
		event: 'items.create',
		handler: async () => {
			await exec('log', 'Creating Item!');
		}
	})

	exec('register-action', {
		event: 'items.create',
		handler: async () => {
			await exec('log', 'Creating Item!');
		}
	})
};
