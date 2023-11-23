export interface Memory {
	get<T = unknown>(key: string): Promise<T | undefined>;
	set<T = unknown>(key: string, value: T): Promise<void>;
	increment(key: string, amount: number): Promise<void>;
}
