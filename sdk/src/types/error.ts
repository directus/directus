export interface DirectusApiError {
	message: string;
	extensions: {
		code: string;
		[key: string]: any;
	};
}

export interface DirectusError {
	message: string;
	errors: DirectusApiError[];
	response: Response;
	data?: any;
}
