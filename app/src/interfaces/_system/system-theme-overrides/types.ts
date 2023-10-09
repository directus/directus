export interface GroupValue {
	[key: string]: string | number | undefined | GroupValue;
}

export type SetValueFn = (path: string[], value: string | number | undefined) => void;
