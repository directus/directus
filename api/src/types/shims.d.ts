declare module 'icc' {
	const parse: (buf: Buffer) => Record<string, string>;
	export { parse };
}
