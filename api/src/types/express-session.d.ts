import { SessionData } from 'express-session';

export = SessionData;

declare module 'express-session' {
	interface SessionData {
		redirect: string;
		grant: any;
	}
}
