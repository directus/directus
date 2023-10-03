export default () => {
	exec('register-operation', {
		id: 'custom',
		handler: ({ text }) => {
			console.log(text);
		},
	})
};
