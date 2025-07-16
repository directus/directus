// Also defined in sdk/src/types/error.ts
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

export interface DirectusExtensionsError<Extensions = void> extends Error {
	extensions: Extensions;
	code: string;
	status: number;
}
