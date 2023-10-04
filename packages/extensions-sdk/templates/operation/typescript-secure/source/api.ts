export default () => {
	exec('register-operation', {
		id: 'custom',
		handler: async ({ text }) => {
			console.log(text);
		},
	})
};
