export interface Lock {
	release(): Promise<void>;
	extend(duration: number): Promise<void>;
}
