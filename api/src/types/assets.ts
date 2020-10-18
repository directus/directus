export type Transformation = {
	key?: string;
	width?: number; // width
	height?: number; // height
	fit?: 'cover' | 'contain' | 'inside' | 'outside'; // fit
	noupscale?: boolean; // Without Enlargement
};

// @NOTE Keys used in Transformation should match ASSET_GENERATION_QUERY_KEYS in constants.ts
