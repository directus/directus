// Also defined in sdk/src/types/error.ts
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

export interface DirectusExtensionsError<Extensions = void> extends Error {
	extensions: Extensions;
	code: string;
	status: number;
}
