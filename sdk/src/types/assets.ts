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
			transforms?: [string, ...any[]][];
	  };
