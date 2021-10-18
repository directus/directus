export class QS {
	static stringify(value: any, prefix?: string): string {
		switch (typeof value) {
			case undefined:
				return '';

			case null:
				return `${prefix}=`;

			case 'boolean':
			case 'number':
				return `${prefix}=${encodeURIComponent(JSON.stringify(value))}`;

			case 'string':
				return `${prefix}=${encodeURIComponent(JSON.stringify(value).split('"').slice(0, -1).join(''))}`;

			case 'object': {
				if (Array.isArray(value))
					return value.map((item, index) => `${prefix}[${index}]${QS.stringify(item, '')}`).join('&');

				return Object.entries(value)
					.map(([key, item]) => QS.stringify(item, `${prefix ? prefix : ''}[${key}]`))
					.join(`&`);
			}
		}

		return '';
	}
}
