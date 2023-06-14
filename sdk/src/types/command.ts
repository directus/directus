import type { RESTRequestOptions } from '../composables/rest.js';

export interface RESTCommand<_Input extends object, _Output extends object | unknown, _Schema extends object> {
	(): RESTRequestOptions;
}
