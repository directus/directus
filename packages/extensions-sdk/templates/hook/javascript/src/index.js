export default ({ filter, action }) => {
	filter('items.create', () => {
		console.log('Creating Item!');
	});

	action('items.create', () => {
		console.log('Item created!');
	});
};
