import { cloneDeepWith } from 'lodash';

export function cloneArraysWithStringIndexes(value: any) {
	if (Array.isArray(value)) {
		const clone = new Array<any>();
		Object.keys(value).forEach((key: any) => (clone[key] = cloneDeepWith(value[key], cloneArraysWithStringIndexes)));
		return clone;
	}
}
