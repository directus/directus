import { defineSecureOperationApi } from '@directus/extensions-sdk';

type Options = {
	text: string;
};

export default defineSecureOperationApi<Options>({
	id: 'custom',
	handler: ({ text }) => {
		console.log(text);
	},
});
