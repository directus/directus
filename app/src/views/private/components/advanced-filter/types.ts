import { Type } from '@directus/shared/types';

export type FieldTree = {
	field: string;
	name: string;
	children?: FieldTree[];
};

export type OperatorType = {
	type: Type;
	operators: string[];
};
