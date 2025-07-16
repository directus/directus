// Also defined in packages/types/src/error.ts
export interface DirectusApiError {
	message: string;
	extensions: {
		code: string;
		[key: string]: any;
	};
}

export interface DirectusError {
	errors: DirectusApiError[];
	response: Response;
}
