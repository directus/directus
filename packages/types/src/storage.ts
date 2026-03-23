export interface Range {
	start: number | undefined;
	end: number | undefined;
}

export type Stat = {
	size: number;
	modified: Date;
};

export type ReadOptions = {
	range?: Range | undefined;
	version?: string | undefined;
};

export type ChunkedUploadContext = {
	size?: number | undefined;
	metadata: Record<string, string | null> | undefined;
};
