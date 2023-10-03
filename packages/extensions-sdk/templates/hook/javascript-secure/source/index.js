export default () => {
	exec('register-filter', {
		event: 'items.create',
		handler: () => {
			console.log('Creating Item!');
		}
	})

	exec('register-action', {
		event: 'items.create',
		handler: () => {
			console.log('Item created!');
		}
	})
};
