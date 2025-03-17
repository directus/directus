import { AxiosError } from 'axios';

export type APIError = {
	message: string;
	extensions: {
		code: string;
		[key: string]: any;
	};
};

export type ValidationError =
	| {
			[key: string]: any;
			code: string;
	  }
	| {
			field: string;
			path: (string | number)[];
			type: string;
			hidden?: boolean;
			group?: string | null;
			valid?: string | number | (string | number)[];
			invalid?: string | number | (string | number)[];
			substring?: string;
	  };

export type APIErrorResponse = AxiosError<{
	errors: APIError[];
}>;
