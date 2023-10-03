type Options = {
	text: string;
};

export default () => {
	exec('register-operation', {
		id: 'custom',
		handler: ({ text }: Options) => {
			console.log(text);
		},
	})
};
