/**
 * The assets endpoint query parameters
 */
export type AssetsQuery =
	| { key: string }
	| {
			key?: never;
			fit?: 'cover' | 'contain' | 'inside' | 'outside';
			width?: number;
			height?: number;
			quality?: number;
			withoutEnlargement?: boolean;
			format?: 'auto' | 'jpg' | 'png' | 'webp' | 'tiff';
			focal_point_x?: number;
			focal_point_y?: number;
			transforms?: [string, ...any[]][];
	  };

/**
 * A Map of response `type` to the corresponding response format.
 */
export type AssetResponse = {
	raw: ReadableStream<Uint8Array>;
	arrayBuffer: ArrayBuffer;
	blob: Blob;
};

/**
 * The download zip options
 */
export type DownloadZipOptions<T extends keyof AssetResponse> = {
	type?: T;
};
