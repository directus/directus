export interface DirectusError<Extensions = void> extends Error {
	extensions: Extensions;
	code: string;
	status: number;
}
