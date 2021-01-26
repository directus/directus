export type APIError = {
	message: string;
	extensions: {
		code: string;
		[key: string]: any;
	};
};
