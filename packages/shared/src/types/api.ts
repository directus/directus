export type APIResponse<T = any> = {
	meta?: {
		total_count?: number;
		filter_count?: number;
	};
	error?: any;
	data: T;
};
