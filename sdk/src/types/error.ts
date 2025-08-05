// Also defined in packages/types/src/error.ts
export interface DirectusApiError {
	message: string;
	extensions: {
		code: string;
		[key: string]: any;
	};
}

export interface DirectusError<R = Response> {
	message: string;
	errors: DirectusApiError[];
	response: R;
	data?: any;
}
