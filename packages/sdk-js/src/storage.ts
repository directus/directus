export type StoredValue = string | number | boolean | Date | StoredObject | StoredArray;

export type StoredArray = StoredValue[];

export type StoredObject = {
	[key: string]: StoredValue | StoredArray;
};

export interface IStorage {
	get<T extends StoredValue>(key: string): Promise<T | undefined>;
	set<T extends StoredValue>(key: string, value: T): Promise<T>;
	delete<T extends StoredValue = any>(key: string): Promise<T | undefined>;
}
