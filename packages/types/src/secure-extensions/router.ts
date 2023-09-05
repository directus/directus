type RouterMethodSecure = (path: string, handler: RequestHandlerSecure) => void;

export type RouterSecure = {
	all: RouterMethodSecure;
	get: RouterMethodSecure;
	post: RouterMethodSecure;
	put: RouterMethodSecure;
	patch: RouterMethodSecure;
	delete: RouterMethodSecure;
	options: RouterMethodSecure;
}

export type RequestHandlerSecure = (req: RequestSecure, res: ResponseSecure) => void;

export type RequestSecure = {
	readonly baseUrl: string;
	readonly body: any;
	readonly fresh: boolean;
	readonly hostname: string;
	readonly ip: string;
	readonly ips: string[];
	readonly method: string;
	readonly originalUrl: string;
	readonly params: Record<string, string>;
	readonly path: string;
	readonly protocol: string;
	readonly query: Record<string, string>;
	readonly secure: boolean;
	readonly stale: boolean;
	readonly subdomains: string[];
	readonly url: string;
	readonly xhr: boolean;
	accepts(...args: any): any;
	acceptsCharsets(...args: any): any;
	acceptsEncodings(...args: any): any;
	acceptsLanguages(...args: any): any;
	get(name: string): string;
	is(name: string): string;
}

export type ResponseSecure = {
	readonly headersSent: boolean;
	append(field: string, value?: string | string[]): void;
	attachment(filename?: string): void;
	end(chunk: any, cb?: () => void): void;
	get(field: string): string;
	json(body?: any): void;
	links(links: any): void;
	location(url: string): void;
	redirect(status: number, url: string): void;
	send(body: any): void;
	sendStatus(code: number): void;
	set(field: string, value?: string | string[]): void;
	status(code: number): void;
	type(type: string): void;
	vary(field: string): void;
}
