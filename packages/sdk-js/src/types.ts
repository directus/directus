import { AxiosRequestConfig } from 'axios';
import { AuthOptions } from './handlers';

export type Item = Record<string, any>;
export type Payload = Record<string, any>;
export type PrimaryKey = string | number;

export enum Meta {
	TOTAL_COUNT = 'total_count',
	FILTER_COUNT = 'filter_count',
}

export type APIError = {
	message: string;
	extensions: {
		code: string;
	};
};

export type Response<T> = {
	data: T | null;
	meta?: Record<Meta, number>;
	errors?: APIError[];
};

export type Query = {
	fields?: string | string[];
	sort?: string;
	filter?: Filter;
	limit?: number;
	offset?: number;
	page?: number;
	single?: boolean;
	meta?: Meta[];
	search?: string;
	export?: 'json' | 'csv';
	deep?: Record<string, Query>;
};

export type Filter = {
	[keyOrOperator: string]: Filter | string | boolean | number | string[];
};

export type FilterOperator =
	| '_eq'
	| '_neq'
	| '_contains'
	| '_ncontains'
	| '_in'
	| '_nin'
	| '_gt'
	| '_gte'
	| '_lt'
	| '_lte'
	| '_null'
	| '_nnull'
	| '_empty'
	| '_nempty';

export type AuthStorage = {
	getItem: (key: string) => Promise<any>;
	setItem: (key: string, value: any) => Promise<any>;
};

export type DirectusOptions = {
	auth?: Partial<AuthOptions>;
	axiosConfig?: AxiosRequestConfig;
};
