declare module 'grant' {
	const grant: any;
	export default grant;
}

declare module 'pino-http' {
	import PinoHttp from '@types/pino-http';
	const pinoHttp: PinoHttp;
	export default pinoHttp;
	export const stdSerializers: {
		req: (req: any) => Record<string, any>;
	};
}

declare module 'icc' {
	const parse: (buf: Buffer) => Record<string, string>;
	export { parse };
}
