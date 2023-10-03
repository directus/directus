export default () => {
	exec('register-filter', {
		event: 'items.create',
		handler: async () => {
			console.log('Creating Item!');
		}
	})

	exec('register-action', {
		event: 'items.create',
		handler: async () => {
			console.log('Item created!');
		}
	})
};
