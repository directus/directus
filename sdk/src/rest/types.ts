import type { RequestOptions } from '../types/request.js';

export interface RestCommand<_Output extends object | unknown, _Schema extends object> {
	(): RequestOptions;
}
