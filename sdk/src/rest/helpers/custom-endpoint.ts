import type { RequestOptions } from '../../index.js';
import type { RestCommand } from '../types.js';

export function customEndpoint<Output = unknown>(options: RequestOptions): RestCommand<Output, never> {
	return () => options;
}
