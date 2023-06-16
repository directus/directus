import type { RequestOptions } from '../types/request.js';

export interface RestCommand<_Input extends object, _Output extends object | unknown, _Schema extends object> {
	(): RequestOptions;
}
