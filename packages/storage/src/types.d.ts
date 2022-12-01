type RangeStart = {
	start: number;
};

type RangeEnd = {
	end: number;
};

export type Range = RangeStart | RangeEnd | (RangeStart & RangeEnd);

export type Stat = {
	size: number;
	modified: Date;
};

export declare class Driver {
	constructor(config: Record<string, unknown>);

	getStream(filepath: string, range?: Range): Promise<NodeJS.ReadableStream>;
	getBuffer(filepath: string): Promise<Buffer>;
	getStat(filepath: string): Promise<Stat>;
	exists(filepath: string): Promise<boolean>;
	put(filepath: string, content: string | Buffer | NodeJS.ReadableStream): Promise<void>;
	delete(filepath: string): Promise<void>;
	move(src: string, dest: string): Promise<void>;
	copy(src: string, dest: string): Promise<void>;
	flatList(prefix = ''): AsyncIterable<string>;
}

export type DriverConfig = {
	name: string;
	options: Record<string, unknown>;
};
