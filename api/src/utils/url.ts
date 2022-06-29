import { URL } from 'url';

export class Url {
	protocol: string | null;
	host: string | null;
	port: string | null;
	path: string[];
	query: Record<string, string>;
	hash: string | null;

	constructor(url: string) {
		const parsedUrl = new URL(url, 'http://localhost');

		const isProtocolRelative = /^\/\//.test(url);
		const isRootRelative = /^\/$|^\/[^/]/.test(url);
		const isPathRelative = /^\./.test(url);

		this.protocol =
			!isProtocolRelative && !isRootRelative && !isPathRelative
				? parsedUrl.protocol.substring(0, parsedUrl.protocol.length - 1)
				: null;
		this.host = !isRootRelative && !isPathRelative ? parsedUrl.hostname : null;
		this.port = parsedUrl.port !== '' ? parsedUrl.port : null;
		this.path = parsedUrl.pathname.split('/').filter((p) => p !== '');
		this.query = Object.fromEntries(parsedUrl.searchParams.entries());
		this.hash = parsedUrl.hash !== '' ? parsedUrl.hash.substring(1) : null;
	}

	public isAbsolute(): boolean {
		return this.protocol !== null && this.host !== null;
	}

	public isProtocolRelative(): boolean {
		return this.protocol === null && this.host !== null;
	}

	public isRootRelative(): boolean {
		return this.protocol === null && this.host === null;
	}

	public addPath(...paths: (string | number)[]): Url {
		const pathToAdd = paths.flatMap((p) => String(p).split('/')).filter((p) => p !== '');

		for (const pathSegment of pathToAdd) {
			if (pathSegment === '..') {
				this.path.pop();
			} else if (pathSegment !== '.') {
				this.path.push(pathSegment);
			}
		}

		return this;
	}

	public setQuery(key: string, value: string): Url {
		this.query[key] = value;

		return this;
	}

	public toString({ rootRelative } = { rootRelative: false }): string {
		const protocol = this.protocol !== null ? `${this.protocol}:` : '';
		const host = this.host ?? '';
		const port = this.port !== null ? `:${this.port}` : '';
		const origin = `${this.host !== null ? `${protocol}//` : ''}${host}${port}`;

		const path = `/${this.path.join('/')}`;
		const query =
			Object.keys(this.query).length !== 0
				? `?${Object.entries(this.query)
						.map(([k, v]) => `${k}=${v}`)
						.join('&')}`
				: '';
		const hash = this.hash !== null ? `#${this.hash}` : '';

		return `${!rootRelative ? origin : ''}${path}${query}${hash}`;
	}
}
