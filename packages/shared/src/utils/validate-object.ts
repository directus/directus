import { Filter } from '../types/filter';
import { merge } from 'lodash';

type ValidationOptions = {
	requireAll: boolean;
};

const defaults: ValidationOptions = {
	requireAll: false,
};

export function validateObject(filter: Filter, data: Record<string, any>, options?: ValidationOptions) {
	options = merge({}, defaults, options);
}
