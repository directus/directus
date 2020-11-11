import * as expressSession from 'express-session';

declare module 'express-session' {
	interface SessionData {
		redirect: string;
		grant: any;
	}
}
