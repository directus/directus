declare module 'pino-http-print' {
	import { Stream, Transform } from 'stream';

	export interface PrettyOptions {
		colorize?: boolean;
		translateTime?: boolean | string;
		[key: string]: any;
	}

	export interface HttpPrintOptions {
		all?: boolean;
		colorize?: boolean;
		lax?: boolean;
		prettyOptions?: PrettyOptions;
		relativeUrl?: boolean;
		translateTime?: boolean | string;
	}

	export interface HttpPrintFactory {
		(options?: HttpPrintOptions): (stream?: Stream) => Transform;
	}

	export const httpPrintFactory: HttpPrintFactory;
	export default httpPrintFactory;
}
