export type Transformation = {
	key?: string;
	w?: number; // width
	h?: number; // height
	f?: 'cover' | 'contain'; // fit
};

// @NOTE Keys used in Transformation should match ASSET_GENERATION_QUERY_KEYS in constants.ts
